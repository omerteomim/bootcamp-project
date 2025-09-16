from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from functools import wraps
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')

# Enable CORS for frontend requests
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"])

# Initialize Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def load_role_prompt():
    try:
        prompt_path = os.path.join(os.path.dirname(__file__), 'role.txt')
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        return "אתה בודק פסיכומטרי מקצועי המתמחה בבדיקת חיבורים וניתוחם."

def token_required(f):
    """Decorator to require JWT token for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Token format invalid'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            # Validate token and get user from Supabase
            user_response = supabase.auth.get_user(token)
            current_user = user_response.user
            if not current_user:
                 return jsonify({'error': 'User not found'}), 401
        except Exception as e:
            return jsonify({'error': 'Token is invalid or expired', 'details': str(e)}), 401

        return f(current_user, *args, **kwargs)

    return decorated

@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        res = supabase.auth.sign_up({"email": email, "password": password})
        
        if res.user and res.user.id:
             return jsonify({'message': 'User created successfully. Please check your email to verify.'}), 201
        elif res.error:
             return jsonify({'error': res.error.message}), 400
        else:
             return jsonify({'error': 'Could not create user.'}), 500

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/signin', methods=['POST'])
def signin():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        res = supabase.auth.sign_in_with_password({"email": email, "password": password})

        return jsonify({
            'message': 'Login successful',
            'token': res.session.access_token,
            'user': {
                'id': res.user.id,
                'email': res.user.email
            }
        }), 200
    except Exception as e:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/verify-token', methods=['POST'])
def verify_token():
    """Verify if the provided token is valid"""
    try:
        data = request.get_json()
        token = data.get('token')

        if not token:
            return jsonify({'valid': False, 'error': 'No token provided'}), 400

        user_response = supabase.auth.get_user(token)
        
        if user_response.user:
            user = user_response.user
            return jsonify({
                'valid': True,
                'user': {
                    'id': user.id,
                    'email': user.email
                }
            }), 200
        else:
            return jsonify({'valid': False, 'error': 'User not found or token invalid'}), 401
    except Exception as e:
        return jsonify({'valid': False, 'error': 'Token is invalid or expired'}), 401

@app.route('/api/analyze-essay', methods=['POST'])
@token_required
def analyze_essay(current_user):
    try:
        data = request.get_json()
        user_text = data.get('text', '')
        user_answer = data.get('answer', '')

        if not user_text or not user_answer:
            return jsonify({'error': 'Both question and answer are required'}), 400

        if os.environ.get('TEST_MODE') == 'true':
            result = f"[TEST MODE] תשובה לשאלה: {user_text}\nתשובה: {user_answer}"
        else:
            role = load_role_prompt()
            api_key = os.environ.get('GROQ_API_KEY')
            if not api_key:
                return jsonify({'error': 'GROQ_API_KEY is not configured'}), 500

            client = Groq(api_key=api_key)
            messages = [
                { "role": "system", "content": role },
                { "role": "user", "content": f"שאלה: {user_text}\nתשובה: {user_answer}" }
            ]
            model_name = "openai/gpt-oss-20b"
            chat_completion = client.chat.completions.create(
                messages=messages,
                model=model_name,
                stream=False
            )
            result = chat_completion.choices[0].message.content

        try:
            supabase.table('history').insert({
                "user_id": current_user.id,
                "question": user_text,
                "answer": user_answer,
                "result": result
            }).execute()
        except Exception as e:
            print(f"DEBUG: history save error: {e}")

        return jsonify({
            'result': result,
            'text': user_text,
            'answer': user_answer,
            'status': 'success'
        })
    except Exception as e:
        err_msg = str(e)
        if 'rate' in err_msg.lower() or '429' in err_msg:
            return jsonify({'error': 'Rate limit exceeded.'}), 429
        if '401' in err_msg or 'unauthorized' in err_msg.lower():
            return jsonify({'error': 'Invalid API key.'}), 401
        if '402' in err_msg or 'payment' in err_msg.lower() or 'credit' in err_msg.lower():
            return jsonify({'error': 'Payment required or credits issue.'}), 402
        return jsonify({'error': f'Internal server error: {err_msg}'}), 500

@app.route('/api/dashboard')
@token_required
def dashboard(current_user):
    return jsonify({
        'message': f'Welcome to your dashboard, {current_user.email}!',
        'user': {
            'id': current_user.id,
            'email': current_user.email
        }
    })

@app.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user):
    res = supabase.table('history').select("*", count='exact').order('created_at', desc=True).limit(50).execute()
    return jsonify({'history': res.data})

@app.route('/api/history', methods=['DELETE'])
@token_required
def delete_history(current_user):
    try:
        supabase.table('history').delete().eq('user_id', current_user.id).execute()
        return jsonify({'message': 'History deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
