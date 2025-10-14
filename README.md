# Future-AI — by Ronnie Pretorius

Quick deploy-ready app for Future-AI (dashboard + PayFast + simple AI proxy).

## Files
- server.js - Node/Express backend
- public/ - frontend (index.html, style.css, script.js)
- sales.json - local datastore (do not commit secrets)

## Deploy (Render)
1. Create branch `final-deploy`.
2. Add files & commit.
3. On Render: New → Web Service → Connect GitHub → select repo & branch `final-deploy`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add Environment variables (Render → Environment)

## Env vars (set on Render)
- ADMIN_KEY (example: Rp760601#!)  
- PAYFAST_MERCHANT_ID  
- PAYFAST_MERCHANT_KEY  
- FROM_EMAIL  
- PLATFORM_CUT (e.g. 0.20)  
- MAILER_PROVIDER (mailersend/sendinblue)  
- MAILER_API_KEY  
- OPENAI_API_KEY  
- ELEVENLABS_KEY
