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
                return jsonify({'error': 'חסר טוקן', 'code': 'NO_TOKEN'}), 401

            try:
                token = token.split(' ')[1]  # להסיר את ה-Bearer
                data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                
                # בדיקה אם הטוקן עומד לפוג בקרוב (פחות מ-24 שעות)
                exp_timestamp = data['exp']
                current_timestamp = datetime.utcnow().timestamp()
                time_until_expiry = exp_timestamp - current_timestamp
                
                if time_until_expiry < 24 * 60 * 60:
                    return jsonify({'error': 'טוקן עומד לפוג', 'code': 'TOKEN_EXPIRING_SOON'}), 401
                    
                return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'טוקן פג תוקף', 'code': 'TOKEN_EXPIRED'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'טוקן לא תקין', 'code': 'INVALID_TOKEN'}), 401
            except Exception:
                return jsonify({'error': 'שגיאה באימות', 'code': 'AUTH_ERROR'}), 401

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
            'exp': datetime.utcnow() + timedelta(days=30)
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

    @app.route('/api/refresh-token', methods=['POST'])
    @authenticate()
    def refresh_token():
        token = request.headers.get('Authorization').split(' ')[1]
        try:
            # בדיקה שהטוקן תקין ולא פג
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # בדיקה שנשאר לפחות יום אחד לפני פקיעה
            exp_timestamp = data['exp']
            current_timestamp = datetime.utcnow().timestamp()
            if exp_timestamp - current_timestamp < 24 * 60 * 60:
                # יצירת טוקן חדש רק אם באמת צריך
                new_token = jwt.encode({
                    'user': data['user'],
                    'role': data['role'],
                    'exp': datetime.utcnow() + timedelta(days=30)
                }, SECRET_KEY)
                return jsonify({'token': new_token})
            
            # אם הטוקן עדיין תקף לזמן רב, נחזיר את אותו טוקן
            return jsonify({'token': token})
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'טוקן פג תוקף', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'טוקן לא תקין', 'code': 'INVALID_TOKEN'}), 401
        except Exception as e:
            return jsonify({'error': 'שגיאה באימות', 'code': 'AUTH_ERROR'}), 401

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