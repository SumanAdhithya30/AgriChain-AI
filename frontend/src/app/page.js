"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Link from "next/link";
import {
  CloudSun, Droplets, Wind, TrendingUp, Package,
  ShoppingCart, Loader2, CheckCircle2, Circle, ArrowRight,
  Sprout, FileText, Store,
} from "lucide-react";
import { fetchWeather, fetchWeatherByCoords } from "../services/weather";
import { checkAndSwitchNetwork } from "../utils/network";
import { REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI } from "../constants";

const ROLE_LABELS = { 1: "Farmer", 2: "Buyer", 3: "Logistics Provider" };
const ROLE_COLORS = {
  1: "bg-green-500/10 text-green-500 border border-green-500/20",
  2: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  3: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
};

// ── Onboarding steps per state ───────────────────────────────────────────────
function OnboardingBanner({ walletConnected, onConnect }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hasMetaMask = mounted && typeof window.ethereum !== "undefined";

  const steps = [
    { label: "Install MetaMask", done: hasMetaMask },
    { label: "Connect your wallet", done: walletConnected },
    { label: "Register your profile", done: false },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Welcome to AgriChain</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Complete these steps to start buying, selling, and tracking agricultural products on-chain.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.done
              ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              : <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />}
            <span className={`text-sm ${step.done ? "text-foreground line-through opacity-50" : "text-foreground"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-1">
        {!walletConnected ? (
          <button
            onClick={onConnect}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Connect Wallet
          </button>
        ) : (
          <Link
            href="/register"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Register Profile <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <Link href="/marketplace" className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 border border-border transition-colors">
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}

// ── Role-specific quick actions ───────────────────────────────────────────────
function QuickActions({ role }) {
  const actions = {
    1: [ // Farmer
      { label: "List a Product", desc: "Create a new product listing", href: "/list-product", icon: Package },
      { label: "My Agreements", desc: "View and settle sales", href: "/agreements", icon: FileText },
      { label: "Yield Prediction", desc: "AI-powered crop forecast", href: "/yield-prediction", icon: Sprout },
    ],
    2: [ // Buyer
      { label: "Marketplace", desc: "Browse available products", href: "/marketplace", icon: Store },
      { label: "My Agreements", desc: "Track your purchases", href: "/agreements", icon: FileText },
      { label: "Track Product", desc: "View supply chain history", href: "/track", icon: TrendingUp },
    ],
    3: [ // Logistics
      { label: "Add Tracking Update", desc: "Update product location", href: "/add-update", icon: TrendingUp },
      { label: "Track Product", desc: "View product history", href: "/track", icon: FileText },
      { label: "Marketplace", desc: "Browse products", href: "/marketplace", icon: Store },
    ],
  };

  const items = actions[role] || actions[2];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
        >
          <action.icon className="h-6 w-6 text-primary mb-3" />
          <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{action.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
        </Link>
      ))}
    </div>
  );
}

// ── Weather card ──────────────────────────────────────────────────────────────
function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const data = await fetchWeatherByCoords(coords.latitude, coords.longitude);
            if (data) setWeather(data);
            setLoading(false);
          },
          async () => {
            const data = await fetchWeather("Madurai");
            if (data) setWeather(data);
            setLoading(false);
          }
        );
      } else {
        const data = await fetchWeather("Madurai");
        if (data) setWeather(data);
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-[200px] relative">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading weather...
        </div>
      ) : weather ? (
        <>
          <p className="text-sm text-muted-foreground mb-1">
            {weather.city}, {weather.country}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt="weather" className="h-14 w-14 -ml-2" />
            <span className="text-4xl font-bold text-foreground">{weather.temp}°C</span>
          </div>
          <p className="text-sm text-foreground capitalize mb-4">{weather.description}</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Droplets, label: "Humidity", value: `${weather.humidity}%`, color: "text-blue-500" },
              { icon: Wind, label: "Wind", value: `${weather.windSpeed} km/h`, color: "text-gray-400" },
              { icon: CloudSun, label: "Precip", value: "--", color: "text-orange-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-lg p-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-destructive text-sm">Failed to load weather.</p>
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Home() {
  const [wallet, setWallet] = useState(null);         // address | null
  const [userProfile, setUserProfile] = useState(undefined); // undefined=loading, null=not registered, object=registered
  const [connecting, setConnecting] = useState(false);

  const fetchProfile = async (address, provider) => {
    try {
      const registry = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_CONTRACT_ABI, provider);
      const user = await registry.users(address);
      const isRegistered = user[2];
      setUserProfile(isRegistered ? { name: user[3][0] || "User", role: Number(user[1]) } : null);
    } catch {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum === "undefined") { setUserProfile(null); return; }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const isCorrect = await checkAndSwitchNetwork(provider);
        if (!isCorrect) { setUserProfile(null); return; }
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWallet(accounts[0].address);
          await fetchProfile(accounts[0].address, provider);
        } else {
          setUserProfile(null);
        }
      } catch { setUserProfile(null); }
    };
    init();
    window.ethereum?.on("accountsChanged", init);
    return () => window.ethereum?.removeListener("accountsChanged", init);
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") { alert("Please install MetaMask."); return; }
    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const isCorrect = await checkAndSwitchNetwork(provider);
      if (!isCorrect) return;
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setWallet(accounts[0]);
        await fetchProfile(accounts[0], provider);
      }
    } catch (e) { console.error(e); }
    finally { setConnecting(false); }
  };

  // Still loading registration check
  const profileLoading = wallet && userProfile === undefined;

  const greeting = userProfile?.name
    ? `Welcome back, ${userProfile.name}`
    : wallet
    ? "Wallet Connected"
    : "Welcome to AgriChain";

  const subtext = userProfile
    ? "Here's your AgriChain dashboard."
    : wallet
    ? "Register your profile to access all features."
    : "A decentralised agricultural supply chain platform.";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{greeting}</h1>
            {userProfile && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[userProfile.role] || ""}`}>
                {ROLE_LABELS[userProfile.role]}
              </span>
            )}
            {profileLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{subtext}</p>
        </div>
      </div>

      {/* Onboarding — shown until registered */}
      {!userProfile && (
        <OnboardingBanner walletConnected={!!wallet} onConnect={connectWallet} />
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeatherCard />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {userProfile ? (
            // Registered — show role hint cards
            <>
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">Registered as</p>
                <p className="text-lg font-bold text-foreground">{userProfile.name}</p>
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[userProfile.role] || ""}`}>
                  {ROLE_LABELS[userProfile.role]}
                </span>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">My Agreements</p>
                  <Link href="/agreements" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    View all &rarr;
                  </Link>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marketplace</p>
                  <Link href="/marketplace" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    Browse products &rarr;
                  </Link>
                </div>
              </div>
            </>
          ) : (
            // Not registered — show what they're missing
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-3">
              <p className="text-sm font-medium text-foreground">What you can do after registering:</p>
              {[
                { role: "Farmer", desc: "List products and receive payments" },
                { role: "Buyer", desc: "Purchase goods with escrow protection" },
                { role: "Logistics", desc: "Update supply chain tracking" },
              ].map((item) => (
                <div key={item.role} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground">{item.role} — </span>
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions — only for registered users */}
      {userProfile && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</p>
          <QuickActions role={userProfile.role} />
        </div>
      )}

      {/* AI Forecast teaser — always visible */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sprout className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">AI Yield & Price Forecasting</p>
          </div>
          <p className="text-foreground font-semibold">Predict your crop yield and market price using our XGBoost model.</p>
        </div>
        <Link
          href="/yield-prediction"
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Prediction <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
