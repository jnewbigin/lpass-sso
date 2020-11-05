# LaughPass

Use `lpass` the lastpass cli tool with Okta SSO!

# Usage

1. install to a suitable location (DBT)

1. `export LPASS_PINENTRY=/path/pinentry`

1. `lpass login --sso <your email address`

1. Complete the login via Okta

1. Your session will be valid for one hour. Configure with the `LPASS_AGENT_TIMEOUT` environment variable (seconds)
