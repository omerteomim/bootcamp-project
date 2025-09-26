FROM python:3.8-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

RUN touch /app/app.log && chown nobody:nogroup /app/app.log

CMD ["python", "app.py"]
