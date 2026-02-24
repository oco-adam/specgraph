import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

/* ---------- SVG icons (inline to avoid external deps) ---------- */

function IconGraph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <line x1="6.7" y1="7.5" x2="10.5" y2="16.5" />
      <line x1="17.3" y1="7.5" x2="13.5" y2="16.5" />
      <line x1="7" y1="6" x2="17" y2="6" />
    </svg>
  );
}

function IconMinimal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* ---------- Data ---------- */

const features = [
  {
    icon: <IconGraph />,
    colorClass: 'sg-feature-card__icon--cyan',
    title: 'Complete',
    description:
      'Capture every dimension of your system: behavior, architecture, design, technology, domain, and constraints.',
  },
  {
    icon: <IconMinimal />,
    colorClass: 'sg-feature-card__icon--emerald',
    title: 'Minimal',
    description:
      "Every node is load-bearing. If removing it wouldn't cause manifestation ambiguity, it doesn't belong.",
  },
  {
    icon: <IconTarget />,
    colorClass: 'sg-feature-card__icon--purple',
    title: 'Predictable',
    description:
      'Two agents given the same spec graph produce logically equivalent systems. The completeness gap is closed.',
  },
];

const nodeTypes = [
  { name: 'feature', color: '#06b6d4' },
  { name: 'behavior', color: '#10b981' },
  { name: 'decision', color: '#8b5cf6' },
  { name: 'domain', color: '#f59e0b' },
  { name: 'constraint', color: '#ef4444' },
  { name: 'design_token', color: '#06b6d4' },
  { name: 'ui_contract', color: '#10b981' },
  { name: 'api_contract', color: '#8b5cf6' },
  { name: 'data_model', color: '#f59e0b' },
  { name: 'artifact', color: '#ec4899' },
];

const graphNodes = [
  { type: 'feature', name: 'user-authentication', color: 'cyan' },
  { type: 'behavior', name: 'login-with-email', color: 'emerald' },
  { type: 'decision', name: 'use-jwt-tokens', color: 'purple' },
  { type: 'behavior', name: 'password-reset-flow', color: 'emerald' },
  { type: 'domain', name: 'user-entity', color: 'cyan' },
  { type: 'constraint', name: 'bcrypt-hashing', color: 'purple' },
];

/* ---------- Components ---------- */

function HeroSection() {
  return (
    <section className="sg-home-hero">
      <h1 className="sg-home-hero__title">
        <span className="sg-home-hero__gradient-text">Spec Graph</span>
      </h1>
      <p className="sg-home-hero__tagline">
        The minimal specification framework for predictable, automated, agent-driven software development.
      </p>
      <div className="sg-home-hero__actions">
        <Link className="sg-btn-primary" to="/docs/introduction">
          Get Started <IconArrowRight />
        </Link>
        <Link className="sg-btn-ghost" to="/docs/guides/getting-started">
          Quick Start Guide
        </Link>
        <Link className="sg-btn-ghost" to="/docs/reference/llm-context-files">
          LLM Context Files
        </Link>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="sg-features">
      <div className="sg-section-header">
        <span className="sg-section-header__label">Why Spec Graph</span>
        <h2 className="sg-section-header__title">Built for agent-driven development</h2>
        <p className="sg-section-header__subtitle">
          A directed, typed graph of atomic specification nodes that captures everything required to manifest a system.
        </p>
      </div>
      <div className="sg-features__grid">
        {features.map((f, i) => (
          <div key={i} className="sg-feature-card">
            <div className={`sg-feature-card__icon ${f.colorClass}`}>
              {f.icon}
            </div>
            <h3 className="sg-feature-card__title">{f.title}</h3>
            <p className="sg-feature-card__desc">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GraphSection() {
  return (
    <section className="sg-graph-section">
      <div className="sg-graph-content">
        <div className="sg-graph-content__text">
          <h3>A graph, not a document</h3>
          <p>
            Each node is atomic, typed, and connected through forward-only edges. Agents traverse the graph to assemble exactly the context they need.
          </p>
          <ul className="sg-graph-content__list">
            <li>
              <IconCheck />
              <span>5 core node types + 7 extensions</span>
            </li>
            <li>
              <IconCheck />
              <span>7 edge types, all forward-only and node-local</span>
            </li>
            <li>
              <IconCheck />
              <span>JSON Schema Draft 2020-12 validated</span>
            </li>
            <li>
              <IconCheck />
              <span>Namespace-scoped features for modular specs</span>
            </li>
          </ul>
        </div>
        <div className="sg-graph-visual">
          <div className="sg-graph-visual__inner">
            {graphNodes.map((node, i) => (
              <div key={i} className="sg-graph-node">
                <span className={`sg-graph-node__dot sg-graph-node__dot--${node.color}`} />
                <span className="sg-graph-node__type">{node.type}</span>
                <span className="sg-graph-node__name">{node.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NodeTypesSection() {
  return (
    <section className="sg-nodes">
      <div className="sg-section-header">
        <span className="sg-section-header__label">Node Types</span>
        <h2 className="sg-section-header__title">12 typed building blocks</h2>
        <p className="sg-section-header__subtitle">
          5 core types for any system, plus 7 extension types for UI, API, data, and pipeline concerns.
        </p>
      </div>
      <div className="sg-nodes__grid">
        {nodeTypes.map((nt) => (
          <div key={nt.name} className="sg-node-badge">
            <span
              className="sg-node-badge__dot"
              style={{ background: nt.color, boxShadow: `0 0 6px ${nt.color}40` }}
            />
            <span className="sg-node-badge__name">{nt.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="sg-cta">
      <h2 className="sg-cta__title">Ready to close the completeness gap?</h2>
      <p className="sg-cta__text">
        Start specifying your system with Spec Graph and enable truly predictable agent-driven manifestation.
      </p>
      <div className="sg-home-hero__actions">
        <Link className="sg-btn-primary" to="/docs/guides/getting-started">
          Get Started <IconArrowRight />
        </Link>
        <Link className="sg-btn-ghost" to="/docs/reference/examples">
          View Examples
        </Link>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

export default function Home(): React.JSX.Element {
  return (
    <Layout description="The minimal specification framework for predictable system manifestation">
      <HeroSection />
      <main>
        <FeaturesSection />
        <GraphSection />
        <NodeTypesSection />
        <CtaSection />
      </main>
    </Layout>
  );
}
