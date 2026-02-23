import socket
try:
    print('Resolving supabase host...')
    ip = socket.gethostbyname('db.mfwpijxzgdbxfxaxxriq.supabase.co')
    print(f'IP Address: {ip}')
    
    print('Testing port 5432...')
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    result = sock.connect_ex((ip, 5432))
    print(f'Port 5432 result: {result} (0 means success)')
    
    print('Testing port 6543...')
    result = sock.connect_ex((ip, 6543))
    print(f'Port 6543 result: {result} (0 means success)')
    
    sock.close()
except Exception as e:
    print(f'Error: {e}')
