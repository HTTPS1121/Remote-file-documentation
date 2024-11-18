import json
import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

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
