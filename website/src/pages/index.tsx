import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className="hero hero--primary" style={{textAlign: 'center', padding: '4rem 2rem'}}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div style={{marginTop: '1.5rem'}}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/introduction">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

const features = [
  {
    title: 'Complete',
    description:
      'Capture every dimension of your system: behavior, architecture, design, technology, domain, and constraints. No more scattered docs.',
  },
  {
    title: 'Minimal',
    description:
      'Every node is load-bearing. If removing it wouldn\'t cause manifestation ambiguity, it doesn\'t belong in the graph.',
  },
  {
    title: 'Predictable',
    description:
      'Two agents given the same spec graph produce logically equivalent systems. The completeness gap is closed.',
  },
];

export default function Home(): React.JSX.Element {
  return (
    <Layout description="The minimal specification framework for predictable system manifestation">
      <HomepageHeader />
      <main>
        <section style={{padding: '2rem 0'}}>
          <div className="container">
            <div className="row">
              {features.map((feature, idx) => (
                <div key={idx} className="col col--4" style={{padding: '1rem'}}>
                  <div style={{textAlign: 'center'}}>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
