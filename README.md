# YNAB-Obsidian Connector
This tool works with your most recently used budget in YNAB, and with an Obsidian vault running the Local REST API plugin.

This tool loads YNAB transaction history as well as account value snapshots into Obsidian so that you can analyze your financial behavior:
1. **Quantitatively** with Dataview and Bases queries
2. **Qualitatively** with journaling and dashboards

## Getting Started
### YNAB Setup
In YNAB, generate a Personal Access Token (PAT). (Account Settings -> Developer Settings -> Personal Access Tokens). Save it in a secure manner.

### Obsidian Setup
Install and enable the Local REST API plugin. Currently this tool only supports unencrypted access to Obsidian, so enable it, but ensure it is safe to do so for your environment.

Note the API key that is provided in the plugin settings.

### Environment Variables
Add an .env file in this project with your YNAB PAT and your Obsidian Local REST API key. It should look like this:

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
uv run --env-file .env -m ynab_obsidian.main
```

## In-Vault Tools
The `scripts` folder contains some Dataview scripts to query your transactions and accounts over time. These assume a certain structure to your vault:

```
|
├── AccountSnapshots
├── Income
├── Investments
├── meta
│   ├── scripts
│   └── templates
├── 'Real Estate'
├── 'Spending By Category'
└── Transactions
```

The default `config.yaml` works with this structure.

To use these scripts,

1. If you are using Obsidian Sync, disable sync for the `meta/scripts` directory.
2. In your terminal, make `meta/scripts` a symbolic link to the `scripts` directory in this project. Running `ls meta/scripts` should show you a bunch of `.js` files.
3. Install and enable the CodeScript Toolkit plugin. Set the script modules root to `meta/scripts`.
4. In a Dataviewjs block, you can now use `const TableUtils = await requireAsync("/TableUtils");` for example.
