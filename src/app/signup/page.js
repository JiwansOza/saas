"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

function setSessionCookie(userData) {
  const value = encodeURIComponent(JSON.stringify(userData));
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `saasify_session=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function SignupPage() {
  const PLANS = [
    { value: "Free",       label: "Free" },
    { value: "Pro",        label: "Pro" },
    { value: "Enterprise", label: "Enterprise" },
  ];

  const ROLES = [
    "Developer",
    "Marketing Manager",
    "CISO / Security",
  ];

const BILLING_STATUSES = [
    { value: "never",  label: "Never paid" },
    { value: "trial",  label: "Trial" },
    { value: "active", label: "Active" },
  ];

  const PLAN_FEATURES = {
    Free:       [],
    Starter:    ["analytics"],
    Pro:        ["analytics", "api_keys"],
    Business:   ["analytics", "api_keys", "custom_roles"],
    Enterprise: ["analytics", "api_keys", "custom_roles", "audit_logs", "white_label"],
  };

  const [form, setForm] = useState({
    name:             "",
    email:            "",
    password:         "",
    confirm_password: "",
    plan:             "Free",
    role:             "",
    billing_status:   "never",
    has_paid:         false,
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === "plan") {
      // Auto-fill features when plan changes
      setForm({ ...form, plan: value, features: PLAN_FEATURES[value] || [], billing_status: value === "Free" ? "never" : "trial" });
    } else if (name === "has_paid") {
      setForm({ ...form, has_paid: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!form.name.trim())  return setError("Name is required");
    if (!form.email.trim()) return setError("Email is required");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");
    if (form.password !== form.confirm_password)
      return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:           form.name.trim(),
          email:          form.email.trim().toLowerCase(),
          password:       form.password,
          plan:           form.plan,
          role:           form.role,
          billing_status: form.billing_status,
          has_paid:       form.has_paid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("saasify_access_token", data.access_token);

      setSessionCookie({
        name:      data.user.name,
        email:     data.user.email,
        plan:      data.user.plan,
        pretaUser: {
          id:             data.user._id,
          plan:           data.user.plan,
          role:           data.user.role,
          has_paid:       data.user.has_paid,
          billing_status: data.user.billing_status,
          risk_score:     data.user.risk_score,
        },
      });

      window.location.href = "/";
    } catch (err) {
      setError("Could not reach server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-muted/30 relative overflow-hidden py-10">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_206%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card dark:border-neutral-700 shadow-lg p-0">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-center">Create an Account</h2>
            <p className="text-muted-foreground text-center">
              Join us today. It&apos;s quick and easy.
            </p>

            {/* Social Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-full text-base py-5 bg-white dark:bg-muted border-border shadow-sm hover:bg-muted/80 dark:hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer"
                variant="outline"
              >
                <svg className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M24 9.5c3.1 0 5.8 1.1 8 3.1l6-6C34.8 3.1 29.7 1 24 1 14.7 1 6.7 6.6 2.8 14.6l7.2 5.6C12.1 14.5 17.6 9.5 24 9.5z" />
                  <path fill="#34A853" d="M46.1 24.5c0-1.5-.1-3-.4-4.5H24v9.1h12.6c-.9 4.5-3.6 7.8-7.6 10.1l7.2 5.6c7-6.5 10.9-15.6 10.9-26.3z" />
                  <path fill="#FBBC05" d="M10.1 28.8c-1-3-1-6.2 0-9.2L2.8 14c-3 6-3 13 0 19l7.3-5.6z" />
                  <path fill="#EA4335" d="M24 47c5.7 0 10.8-1.9 15-5.3l-7.2-5.6c-2.2 1.4-5 2.3-7.8 2.3-6.4 0-11.9-5-13.8-11.5l-7.3 5.6C6.7 41.4 14.7 47 24 47z" />
                </svg>
                Sign up with Google
              </Button>

              <Button
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-full text-base py-5 bg-white dark:bg-muted border-border shadow-sm hover:bg-muted/80 dark:hover:bg-muted-foreground/10 transition-all duration-300 cursor-pointer"
                variant="outline"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Sign up with GitHub
              </Button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="h-px w-full bg-border"></div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="h-px w-full bg-border"></div>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="plan">Plan</Label>
                <select
                  name="plan"
                  id="plan"
                  value={form.plan}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                >
                  {PLANS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  name="role"
                  id="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">Select your role</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>


              {/* Billing Status */}
              <div>
                <Label htmlFor="billing_status">Billing Status</Label>
                <select
                  name="billing_status"
                  id="billing_status"
                  value={form.billing_status}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                >
                  {BILLING_STATUSES.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              {/* Has Paid */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="has_paid"
                    checked={form.has_paid}
                    onChange={handleChange}
                    disabled={loading}
                    className="rounded border-input accent-primary w-4 h-4"
                  />
                  <span className="text-sm font-medium">Has paid before</span>
                </label>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 w-full"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  type="password"
                  name="confirm_password"
                  id="confirm_password"
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  className="mt-1 w-full"
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-4 rounded-full text-base py-5 cursor-pointer bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg group"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-all ease-in-out duration-300" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-base text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>

          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
