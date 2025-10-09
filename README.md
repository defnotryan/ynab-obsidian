Add an .env file with your YNAB PAT. It should look like this:

```
YNAB_PAT=your_super_secret_token
```

Run the script with:
```bash
uv run --env-file .env main.py
```