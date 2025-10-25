taskkill /F /IM python.exe 2>$null
Start-Sleep -Seconds 1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python cors_server.py"
