from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from functools import wraps
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_client import Counter, Histogram, Gauge

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'supersecretkey')

# Initialize Prometheus metrics
metrics = PrometheusMetrics(app)

# Add info metric about the app
metrics.info('app_info', 'Application info', version='1.0.0')

# Custom metrics for specific tracking
essay_analysis_counter = Counter(
    'essay_analysis_total',
    'Total number of essay analyses',
    ['user_id', 'status']
)

essay_analysis_duration = Histogram(
    'essay_analysis_duration_seconds',
    'Time spent analyzing essays',
    ['status']
)

auth_attempts_counter = Counter(
    'auth_attempts_total',
    'Total authentication attempts',
    ['endpoint', 'status']
)

active_users_gauge = Gauge(
    'active_users',
    'Number of currently active users'
)

groq_api_calls = Counter(
    'groq_api_calls_total',
    'Total calls to Groq API',
    ['status']
)

supabase_operations = Counter(
    'supabase_operations_total',
    'Total Supabase operations',
    ['operation', 'table', 'status']
)

# Configure logging
logging.basicConfig(filename='app.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

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
            auth_attempts_counter.labels(endpoint='signup', status='invalid_input').inc()
            return jsonify({'error': 'Email and password are required'}), 400

        res = supabase.auth.sign_up({"email": email, "password": password})
        
        if res.user and res.user.id:
            auth_attempts_counter.labels(endpoint='signup', status='success').inc()
            supabase_operations.labels(operation='insert', table='auth', status='success').inc()
            return jsonify({'message': 'User created successfully. Please check your email to verify.'}), 201
        elif res.error:
            auth_attempts_counter.labels(endpoint='signup', status='failed').inc()
            supabase_operations.labels(operation='insert', table='auth', status='failed').inc()
            return jsonify({'error': res.error.message}), 400
        else:
            auth_attempts_counter.labels(endpoint='signup', status='failed').inc()
            return jsonify({'error': 'Could not create user.'}), 500

    except Exception as e:
        auth_attempts_counter.labels(endpoint='signup', status='error').inc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/signin', methods=['POST'])
def signin():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            auth_attempts_counter.labels(endpoint='signin', status='invalid_input').inc()
            return jsonify({'error': 'Email and password are required'}), 400

        res = supabase.auth.sign_in_with_password({"email": email, "password": password})

        user = res.user
        profile_data = None
        if user:
            profile_data = user.user_metadata
            auth_attempts_counter.labels(endpoint='signin', status='success').inc()
            supabase_operations.labels(operation='select', table='auth', status='success').inc()
            active_users_gauge.inc()

        return jsonify({
            'message': 'Login successful',
            'token': res.session.access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'profile': profile_data # Include profile data here
            }
        }), 200
    except Exception:
        auth_attempts_counter.labels(endpoint='signin', status='failed').inc()
        supabase_operations.labels(operation='select', table='auth', status='failed').inc()
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
            profile_data = user.user_metadata

            return jsonify({
                'valid': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'created_at': user.created_at,
                    'user_metadata': user.user_metadata,
                    'profile': profile_data # Include profile data here
                }
            }), 200
        else:
            return jsonify({'valid': False, 'error': 'User not found or token invalid'}), 401
    except Exception:
        return jsonify({'valid': False, 'error': 'Token is invalid or expired'}), 401

@app.route('/api/user/update', methods=['POST'])
@token_required
def update_user(current_user):
    try:
        data = request.get_json()
        name = data.get('name')
        phone = data.get('phone')

        service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        if not service_key:
            return jsonify({'error': 'SUPABASE_SERVICE_ROLE_KEY is not configured'}), 500

        supabase_admin = create_client(url, service_key)

        attributes = {'user_metadata': {'name': name, 'phone': phone}}
        supabase_admin.auth.admin.update_user_by_id(current_user.id, attributes)

        return jsonify({'message': 'User updated successfully',
            'user': attributes['user_metadata']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-essay', methods=['POST'])
@token_required
def analyze_essay(current_user):
    import time
    start_time = time.time()

    try:
        data = request.get_json()
        user_text = data.get('text', '')
        user_answer = data.get('answer', '')

        if not user_text or not user_answer:
            essay_analysis_counter.labels(user_id=current_user.id, status='invalid_input').inc()
            return jsonify({'error': 'Both question and answer are required'}), 400

        if os.environ.get('TEST_MODE') == 'true':
            essay_analysis_counter.labels(user_id=current_user.id, status='test_mode').inc()
            result = f"[TEST_MODE] תשובה לשאלה: {user_text}\nתשובה: {user_answer}"
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
            groq_api_calls.labels(status='success').inc()
            essay_analysis_counter.labels(user_id=current_user.id, status='success').inc()

        try:
            supabase.table('history').insert({
                "user_id": current_user.id,
                "question": user_text,
                "answer": user_answer,
                "result": result
            }).execute()
            supabase_operations.labels(operation='insert', table='history', status='success').inc()
        except Exception as e:
            app.logger.error(f"DEBUG: history save error: {e}")
            supabase_operations.labels(operation='insert', table='history', status='failed').inc()

        duration = time.time() - start_time
        essay_analysis_duration.labels(status='success').observe(duration)

        return jsonify({
            'result': result,
            'text': user_text,
            'answer': user_answer,
            'status': 'success'
        })
    except Exception as e:
        duration = time.time() - start_time
        err_msg = str(e)
        
        if 'rate' in err_msg.lower() or '429' in err_msg:
            essay_analysis_counter.labels(user_id=current_user.id, status='rate_limited').inc()
            groq_api_calls.labels(status='rate_limited').inc()
            essay_analysis_duration.labels(status='rate_limited').observe(duration)
            return jsonify({'error': 'Rate limit exceeded.'}), 429
        if '401' in err_msg or 'unauthorized' in err_msg.lower():
            essay_analysis_counter.labels(user_id=current_user.id, status='unauthorized').inc()
            groq_api_calls.labels(status='unauthorized').inc()
            essay_analysis_duration.labels(status='error').observe(duration)
            return jsonify({'error': 'Invalid API key.'}), 401
        if '402' in err_msg or 'payment' in err_msg.lower() or 'credit' in err_msg.lower():
            essay_analysis_counter.labels(user_id=current_user.id, status='payment_required').inc()
            groq_api_calls.labels(status='payment_required').inc()
            essay_analysis_duration.labels(status='error').observe(duration)
            return jsonify({'error': 'Payment required or credits issue.'}), 402
        
        essay_analysis_counter.labels(user_id=current_user.id, status='error').inc()
        groq_api_calls.labels(status='error').inc()
        essay_analysis_duration.labels(status='error').observe(duration)
        return jsonify({'error': f'Internal server error: {err_msg}'}), 500

@app.route('/api/history', methods=['GET'])
@token_required
def get_history(current_user):
    res = supabase.table('history').select("*", count='exact').eq('user_id', current_user.id).order('created_at', desc=True).limit(50).execute()
    return jsonify({'history': res.data})

@app.route('/api/history', methods=['DELETE'])
@token_required
def delete_history(current_user):
    try:
        supabase.table('history').delete().eq('user_id', current_user.id).execute()
        return jsonify({'message': 'History deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/history/<int:item_id>', methods=['DELETE'])
@token_required
def delete_history_item(current_user, item_id):
    try:
        # Ensure users can only delete their own history items
        res = supabase.table('history').delete().match({'id': item_id, 'user_id': current_user.id}).execute()
        
        # The `execute` method on delete doesn't raise an error for 0 rows, 
        # so we check the count to see if anything was deleted.
        if len(res.data) == 0:
            return jsonify({'error': 'Item not found or you do not have permission to delete it'}), 404

        return jsonify({'message': 'History item deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
