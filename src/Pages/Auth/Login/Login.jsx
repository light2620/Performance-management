// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import "../style.css";
import logo from "../../../assets/Logo-Orange.png"; // Authority Entrepreneurs logo
import { FiEye, FiEyeOff } from "react-icons/fi";
import { login } from "../../../Apis/AuthApis";
import toast from "react-hot-toast";
import { useAuth } from "../../../Utils/AuthContext";
import Spinner from "../../../Utils/SmallSpinner/SmallSpinner";
import { getCurrentUserApi } from "../../../Apis/UserApi";
import { IoStatsChartSharp } from "react-icons/io5";
import { useWebSocket } from "../../../Provider/WebSocketProvider";
import { useNotifications } from "../../../Provider/NotificationProvider";

const Login = () => {
  const { setIsLoggedIn, setUser } = useAuth();
  const [creds, setCreds] = useState({ company_email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errs, setErrs] = useState({ company_email: false, password: false });
  const { connect } = useWebSocket();
const { connectNotification, close } = useNotifications();
const handleChange = (e) => {
  const { name, value } = e.target;

  // Prevent spaces for password field
  const newValue =
    name === "password" ? value.replace(/\s/g, "") : value;

  setErrs((p) => ({ ...p, [name]: false }));
  setCreds((p) => ({ ...p, [name]: newValue }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emptyEmail = !creds.company_email?.trim();
    const emptyPass = !creds.password || /\s/.test(creds.password);
    if (emptyEmail || emptyPass) {
      setErrs({ company_email: emptyEmail, password: emptyPass });
      return;
    }

    try {
      setLoading(true);
      await login(creds,connect);
      setIsLoggedIn(true);
      const userRes = await getCurrentUserApi();
      setUser(userRes.data);
      connect();
      connectNotification();
      toast.success("Login successful!");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const APP_NAME = "MeritFlow";

  return (
    <div className="lf-page">
      {/* Hero */}
      <aside className="lf-hero">
        <div className="lf-hero-inner">
          {/* Inline SVG illustration */}
          <IoStatsChartSharp color="white" size={28}/>
          <h1 className="lf-hero-title">Encourages growth through points</h1>

          <p className="lf-hero-sub">
            A transparent system where employees can track their points,
            award colleagues with merits or demerits, and view their own
            performance history.
          </p>

          <p className="lf-hero-tag">
            Reward great work. Track improvements. Make performance fair.
          </p>

          <div className="lf-hero-footer">
            © {new Date().getFullYear()} <strong>{APP_NAME}</strong>
          </div>
        </div>
      </aside>

      {/* Right / Form */}
      <main className="lf-form-wrap">
        <div className="lf-form-card" role="main">
          <img src={logo} alt={`${APP_NAME} logo`} className="lf-logo" />

          <div className="lf-title-block">
            <h2>Welcome Back!</h2>
            <p className="lf-help">Sign in to access your performance dashboard</p>
          </div>

          <form className="lf-form" onSubmit={handleSubmit} noValidate>
            <label className="lf-label" htmlFor="company_email">
              Company Email*
            </label>
            <input
              id="company_email"
              name="company_email"
              type="email"
              className={`lf-input ${errs.company_email ? "lf-err-input" : ""}`}
              placeholder="you@company.com"
              value={creds.company_email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
            />
            {errs.company_email && (
              <div className="lf-error">Please enter a valid email address.</div>
            )}

            <label className="lf-label" htmlFor="password">
              Password*
            </label>
            <div className="lf-password-row">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`lf-input ${errs.password ? "lf-err-input" : ""}`}
                placeholder="Enter your password"
                value={creds.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lf-pass-toggle"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errs.password && (
              <div className="lf-error">Password is required.</div>
            )}

            <button className="lf-submit" type="submit" disabled={loading}>
              {loading ? <Spinner /> : "Login Now"}
            </button>
          </form>

        
        </div>
      </main>
    </div>
  );
};

export default Login;
