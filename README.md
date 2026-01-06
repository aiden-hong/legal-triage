# Legal Triage

Conservative legal risk triage system for product ideas, features, and campaigns.

## Overview

Legal Triage is a CLI tool that helps teams quickly assess whether a product idea or feature needs legal review. It follows a **conservative principle**: when in doubt, route to legal review (TYPE_1).

**Key Principles:**
- **Minimize False Negatives**: If uncertain, always route to TYPE_1 (legal review)
- **Not Legal Advice**: This is a risk triage tool, not a substitute for legal judgment
- **Audit Trail**: All decisions are logged with reasoning for compliance

## Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

## Usage

### Interactive Mode

```bash
# Start interactive triage
legal-triage check -i

# Or simply
legal-triage check
```

### Command Line Mode

```bash
# Basic usage
legal-triage check -d "Description of your product idea"

# With all options
legal-triage check \
  -d "New payment feature for user subscriptions" \
  -e public \
  -u collects \
  -r subscription \
  -c customer_facing \
  -b domestic_only
```

### Quick Check (One-line Output)

```bash
legal-triage quick "Simple UI button color change"
# Output: [TYPE_2] confidence=0.90 flags=none next=PROCEED_WITH_GUARDRAILS
```

### View Statistics

```bash
legal-triage stats
```

## Options

| Option | Description | Values |
|--------|-------------|--------|
| `-d, --description` | Description of the idea/feature | Text |
| `-e, --exposure` | Exposure scope | `public`, `members_only`, `specific_group`, `internal_test` |
| `-u, --data-usage` | Data usage | `collects`, `no_collection`, `unclear` |
| `-r, --revenue` | Revenue model | `free`, `paid_once`, `subscription`, `ads`, `commission` |
| `-c, --communication` | External communication | `customer_facing`, `media`, `internal` |
| `-b, --cross-border` | Cross-border scope | `domestic_only`, `includes_overseas`, `unclear` |
| `-j, --json` | Output as JSON only | - |
| `--no-color` | Disable colored output | - |
| `--no-log` | Disable audit logging | - |
| `-i, --interactive` | Interactive mode | - |

## Output Schema

```json
{
  "routing": "TYPE_1" | "TYPE_2",
  "confidence": 0.0-1.0,
  "red_flags": [
    {
      "code": "PII_COLLECTION",
      "reason": "Personal data collection requires review",
      "matchedKeywords": ["personal data"],
      "severity": "critical"
    }
  ],
  "missing_info_questions": [
    "What is the exposure scope of this service?"
  ],
  "safe_guardrails": [
    "User consent must be obtained for data collection"
  ],
  "recommended_next_step": "LEGAL_REVIEW" | "PROCEED_WITH_GUARDRAILS",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "input_hash": "abc123..."
}
```

## Routing Types

| Type | Meaning | Action |
|------|---------|--------|
| **TYPE_1** | Legal review required | Send to legal team for review |
| **TYPE_2** | Low risk | Can proceed with guardrails |

## Red Flag Categories

The tool detects the following risk categories (see `rubric.yaml` for full list):

- **Privacy/Data**: PII collection, cross-border transfer, children data
- **Financial**: Payment handling, investment products, loans
- **Medical**: Health claims, diagnosis, treatment
- **Advertising**: Exaggerated claims, comparative ads, endorsements
- **Legal**: Liability waivers, auto-renewal, user content
- **IP**: Trademark usage, copyright concerns
- **Regulated**: Alcohol, gambling, adult content

## Customization

Edit `rubric.yaml` to customize:
- Red flag keywords and severity
- Question templates
- Guardrail messages
- Routing thresholds

## Privacy & Logging

- **Local Execution**: All processing happens locally
- **Privacy Mode**: Logs store only hashes and labels, not original text
- **Disable Logging**: Use `--no-log` to disable audit trail

Log files are stored in `.legal-triage-logs/` by default.

## Development

```bash
# Run tests
npm test

# Run in development mode
npm run dev -- check -d "test"

# Build
npm run build
```

## Example Scenarios

### TYPE_1 Examples (Legal Review Required)

```bash
# Personal data collection
legal-triage quick "Collecting user SSN for identity verification"
# [TYPE_1] confidence=0.95 flags=PII_COLLECTION next=LEGAL_REVIEW

# Children-targeted service
legal-triage quick "Educational app for children under 14"
# [TYPE_1] confidence=0.95 flags=CHILDREN_TARGET next=LEGAL_REVIEW

# Financial product
legal-triage quick "Investment platform for stock trading"
# [TYPE_1] confidence=0.95 flags=FINANCIAL_PRODUCT next=LEGAL_REVIEW
```

### TYPE_2 Examples (Can Proceed)

```bash
# Simple internal tool
legal-triage check -d "Internal team calendar tool" -e internal_test -u no_collection
# [TYPE_2] confidence=0.90 next=PROCEED_WITH_GUARDRAILS

# UI change
legal-triage quick "Change button color from blue to green"
# [TYPE_2] confidence=0.90 flags=none next=PROCEED_WITH_GUARDRAILS
```

## License

ISC
