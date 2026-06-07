# LabMate — AI Lab Report Helper

Turn rough chemistry experiment notes into a clean, structured lab report draft.

Built as the capstone MVP for the "Generative AI Mastery Certificate for Managerial Excellence" (upGrad).

## What it does
- Student enters: title, aim, chemicals, apparatus, rough procedure, readings
- AI (OpenAI gpt-4o-mini) returns a full report draft: Aim, Theory, Apparatus, Procedure (past tense, passive voice), Observation table, Calculations, Result, Precautions, Sources of Error, Conclusion
- Never invents readings — missing values become clear placeholders
- Copy / Download as .md / Print to PDF

## Project structure
```
labmate/
├── index.html        # full frontend (no build step needed)
├── api/
│   └── generate.js   # Vercel serverless function (calls OpenAI, hides the API key)
└── README.md
```

## Deploy to Vercel (free, ~10 minutes)

### Step 1: Get an OpenAI API key
1. Go to https://platform.openai.com/api-keys
2. Sign in and click "Create new secret key" — copy it
3. Add a small credit at https://platform.openai.com/settings/organization/billing
   ($5 is more than enough — each report costs well under 1 rupee with gpt-4o-mini)

### Step 2: Put the code on GitHub
1. Create a new repo on GitHub (e.g. `labmate`)
2. Upload these files (keep the folder structure — `api/generate.js` must stay inside `api/`)

### Step 3: Deploy on Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New → Project" and import the `labmate` repo
3. Before clicking Deploy, open "Environment Variables" and add:
   - Name: `OPENAI_API_KEY`
   - Value: (paste your key from Step 1)
4. Click Deploy

Done. You get a public link like `https://labmate-xyz.vercel.app` — anyone can open it, no login needed.

### Alternative: Vercel CLI
```bash
npm i -g vercel
cd labmate
vercel
# then in the Vercel dashboard, add the OPENAI_API_KEY env variable
# and run:
vercel --prod
```

## Notes
- gpt-4o-mini is very cheap: one report ≈ ₹0.10–0.20, so $5 credit covers hundreds of reports
- The API key never reaches the browser — it lives only in the serverless function
- To use a different model, change `gpt-4o-mini` in `api/generate.js`
