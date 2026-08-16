import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surfaced to the browser console for debugging; the UI below
    // is what a real user (or reviewer) sees instead of a blank page.
    console.error("TeamOrbit crashed:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "32px 24px",
            textAlign: "center",
            fontFamily: "Work Sans, sans-serif",
            color: "#1c2321",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 700 }}>Something went wrong</div>
          <div style={{ fontSize: "14px", color: "#5b6663", maxWidth: "360px" }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: "8px",
              padding: "10px 20px",
              borderRadius: "999px",
              border: "none",
              background: "#0f5c4c",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
