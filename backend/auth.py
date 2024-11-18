from flask import jsonify, request
import jwt
import json
import os
from datetime import datetime, timedelta
from functools import wraps
import bcrypt
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv('SECRET_KEY')

def load_users():
    with open('users.json', 'r') as f:
        return json.load(f)['users']

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def authenticate():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            
            if not token:
                return jsonify({'error': 'חסר טוקן'}), 401

            try:
                token = token.split(' ')[1]  # להסיר את ה-Bearer
                data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                return f(*args, **kwargs)
            except:
                return jsonify({'error': 'טוקן לא תקין'}), 401

        return decorated_function
    return decorator

def init_auth_routes(app):
    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        users = load_users()
        user = next((u for u in users if u['username'] == username), None)

        if not user or not check_password(password, user['password']):
            return jsonify({'error': 'שם משתמש או סיסמה שגויים'}), 401

        token = jwt.encode({
            'user': username,
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY)

        return jsonify({
            'token': token,
            'user': {
                'username': user['username'],
                'role': user['role']
            }
        })

    @app.route('/api/verify-token', methods=['POST'])
    @authenticate()
    def verify_token():
        return jsonify({'valid': True}) 

def update_passwords():
    with open('users.json', 'r') as f:
        data = json.load(f)
    
    for user in data['users']:
        if not user['password'].startswith('$2b$'):  # בדיקה שהסיסמה עוד לא מוצפנת
            user['password'] = hash_password(user['password'])
    
    with open('users.json', 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    update_passwords() 