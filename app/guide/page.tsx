
export const metadata = {
  title: "Guide",
  description:
    "A getting-started guide to R3IGN HQ registration, divisions, and rankings.",
};

export default function GuidePage() {
  return (
    <>
      <main id="main-content">
        <div className="page-header">
          <div className="wrap">
            <span className="breadcrumb">
              <a href="/">Home</a> / Guide
            </span>
            <span className="eyebrow" style={{ marginTop: "1rem", display: "inline-flex" }}>
              New Here?
            </span>
            <h1>Getting Started Guide</h1>
            <p>
              A quick walkthrough of how registration, divisions, and rankings
              fit together in R3IGN HQ.
            </p>
          </div>
        </div>

        <section>
          <div className="wrap">
            <div className="value-list">
              <div className="value-row">
                <div className="idx">01</div>
                <div>
                  <h3>Pick a league</h3>
                  <p>
                    RCML, RFCL and RBSL each run their own seasons and
                    standings. Check Leagues to see which are open.
                  </p>
                </div>
              </div>
              <div className="value-row">
                <div className="idx">02</div>
                <div>
                  <h3>Register your organization</h3>
                  <p>
                    Submit your roster and captain details through the
                    registration form to be placed for the next series.
                  </p>
                </div>
              </div>
              <div className="value-row">
                <div className="idx">03</div>
                <div>
                  <h3>Start at Division 6</h3>
                  <p>
                    New organizations begin at the entry tier and move up or
                    down each series based on results.
                  </p>
                </div>
              </div>
              <div className="value-row">
                <div className="idx">04</div>
                <div>
                  <h3>Compete in matches</h3>
                  <p>
                    Each series brings scheduled matches with live kill tracking
                    and standings updates. Every match is played under the{" "}
                    <a href="/rules" style={{ color: "var(--amber)" }}>
                      league rules
                    </a>
                    .
                  </p>
                </div>
              </div>
              <div className="value-row">
                <div className="idx">05</div>
                <div>
                  <h3>Track your ranking</h3>
                  <p>
                    Standings update after every reported match &mdash; check
                    Rankings to see where your organization sits.
                  </p>
                </div>
              </div>
            </div>
            <div className="center mt-lg">
              <a href="/register" className="btn btn-primary">
                Register Your Organization
              </a>{" "}
              <a href="/rules" className="btn btn-ghost">
                Read the League Rules
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}