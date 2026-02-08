import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const schemas = [
  {
    name: 'graph.schema.json',
    description: 'Validates the graph.json index file — the entry point of a spec graph.',
    href: '/specgraph/schemas/graph.schema.json',
  },
  {
    name: 'node.schema.json',
    description: 'Validates individual node files (behavior, decision, domain, constraint, feature, and extensions).',
    href: '/specgraph/schemas/node.schema.json',
  },
  {
    name: 'graph-index.schema.json',
    description: 'Validates the optional generated edge index for fast tooling traversal.',
    href: '/specgraph/schemas/graph-index.schema.json',
  },
  {
    name: 'manifest-lock.schema.json',
    description: 'Validates the optional manifestation lockfile that pins artifact hashes and toolchain metadata.',
    href: '/specgraph/schemas/manifest-lock.schema.json',
  },
];

export default function Schemas(): React.JSX.Element {
  return (
    <Layout title="JSON Schemas" description="Spec Graph JSON Schema definitions">
      <main className="container sg-schemas">
        <div className="sg-section-header" style={{textAlign: 'left'}}>
          <span className="sg-section-header__label">Reference</span>
          <h1 className="sg-section-header__title">JSON Schemas</h1>
          <p className="sg-section-header__subtitle" style={{margin: 0}}>
            All schemas use{' '}
            <a href="https://json-schema.org/specification">JSON Schema Draft 2020-12</a>.
            See the <Link to="/docs/reference/json-schemas">schema reference docs</Link> for details.
          </p>
        </div>
        <div className="sg-schemas__grid">
          {schemas.map((schema) => (
            <div key={schema.name} className="sg-schema-card">
              <div className="sg-schema-card__name">
                <a href={schema.href}>
                  <code>{schema.name}</code>
                </a>
              </div>
              <p className="sg-schema-card__desc">{schema.description}</p>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
