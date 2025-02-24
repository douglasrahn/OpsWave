import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Express } from 'express';
import { storage } from './storage';

export interface OAuthProfile {
  provider: string;
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
}

export function setupOAuth(app: Express) {
  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Store OAuth tokens in user session
      const user = await storage.findOrCreateOAuthUser({
        provider: 'google',
        providerId: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value,
        accessToken,
        refreshToken
      });
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // GitHub OAuth Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback',
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await storage.findOrCreateOAuthUser({
        provider: 'github',
        providerId: profile.id,
        displayName: profile.displayName || profile.username!,
        email: profile.emails?.[0]?.value,
        accessToken,
        refreshToken
      });
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // OAuth Routes
  app.get('/auth/google', passport.authenticate('google'));
  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
  );

  app.get('/auth/github', passport.authenticate('github'));
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
  );

  // OAuth Token Management
  app.get('/api/oauth/tokens', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
      const tokens = await storage.getOAuthTokens(req.user.id);
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch OAuth tokens' });
    }
  });
}
