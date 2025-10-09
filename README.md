# YNAB-Obsidian Connector
This tool works with your most recently used budget in YNAB, and with an Obsidian vault running the Local REST API plugin.

The goal is (eventually) to be able to load YNAB transaction history into Obsidian so that you can analyze your financial behavior:
1. **Quantitatively** with Dataview and Bases queries
2. **Qualitatively** with journaling and dashboards

## Getting Started

Add an .env file with your YNAB PAT and your Obsidian Local REST API key. It should look like this:

```
YNAB_PAT=your_super_secret_token
OBSIDIAN_API_KEY=your_super_secret_api_key
```

Copy the `config.template.yaml` file into `config.yaml`:
```bash
cp config.template.yaml config.yaml
```

Fill out the values in that file. Most of the defaults should be fine.

Run the script with:
```bash
uv run --env-file .env main.py
```