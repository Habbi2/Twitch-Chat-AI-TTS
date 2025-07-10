# Deployment Guide for Twitch AI Assistant

## Prerequisites
1. ✅ Vercel CLI installed
2. ✅ Git repository initialized
3. ✅ Next.js application ready

## Deployment Steps

### 1. Login to Vercel
```bash
vercel
```
Follow the prompts to log in with your preferred method (GitHub recommended).

### 2. Configure Project
During the first deployment, Vercel will ask:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (for first time)
- **Project name** → `twitch-ai-assistant` (or your preferred name)
- **Directory** → `./` (current directory)
- **Override settings?** → No (use defaults)

### 3. Set Environment Variables
After deployment, go to your Vercel dashboard and add these environment variables:

#### Required Variables:
- `NEXT_PUBLIC_TWITCH_CHANNEL` - Your Twitch channel name
- `HUGGINGFACE_API_TOKEN` - Your HuggingFace API token

#### Optional Variables:
- `NEXT_PUBLIC_TWITCH_BOT_USERNAME` - Bot username (defaults to anonymous)
- `NEXT_PUBLIC_TWITCH_OAUTH_TOKEN` - OAuth token for chat interaction
- `HUGGINGFACE_API_URL` - API URL (has default)
- `HUGGINGFACE_MODEL` - Model name (has default)

### 4. Redeploy with Environment Variables
After setting environment variables:
```bash
vercel --prod
```

## Getting API Tokens

### HuggingFace API Token:
1. Go to https://huggingface.co/
2. Create an account or log in
3. Go to Settings → Access Tokens
4. Create a new token with "Read" permissions
5. Copy the token and add it to Vercel environment variables

### Twitch OAuth Token (Optional):
1. Go to https://twitchapps.com/tmi/
2. Connect with your Twitch account
3. Copy the OAuth token (starts with `oauth:`)
4. Add to Vercel environment variables

## Verification
- Your app will be available at `https://your-project-name.vercel.app`
- Check the sentiment analysis API at `/api/sentiment`
- Test Twitch chat connection with your channel

## Troubleshooting
- Check Vercel function logs for any errors
- Ensure all environment variables are set correctly
- Verify HuggingFace API token has correct permissions
