// src/theme.ts
// Glossmorphism color palette for JY School mobile app
// Using vibrant gradients and subtle glass blur effects

export const Colors = {
  primary: "hsl(220, 90%, 55%)", // deep blue
  secondary: "hsl(340, 80%, 60%)", // vivid pink
  background: "hsl(0, 0%, 98%)",
  surface: "hsla(0, 0%, 100%, 0.6)", // glass surface with opacity
  textPrimary: "hsl(0, 0%, 10%)",
  textSecondary: "hsl(0, 0%, 40%)",
  accent: "hsl(50, 100%, 50%)",
};

export const Gradients = {
  header: "linear-gradient(135deg, hsl(220,90%,55%), hsl(340,80%,60%))",
  card: "linear-gradient(135deg, hsla(220,90%,55%,0.8), hsla(340,80%,60%,0.8))",
};

export const Shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const BorderRadius = 12;
