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
      <main className="container" style={{padding: '2rem 0'}}>
        <h1>JSON Schemas</h1>
        <p>
          All schemas use <a href="https://json-schema.org/specification">JSON Schema Draft 2020-12</a>.
          See the <Link to="/docs/reference/json-schemas">schema reference docs</Link> for details.
        </p>
        <div className="row">
          {schemas.map((schema) => (
            <div key={schema.name} className="col col--6" style={{marginBottom: '1.5rem'}}>
              <div className="card">
                <div className="card__header">
                  <h3>
                    <a href={schema.href}><code>{schema.name}</code></a>
                  </h3>
                </div>
                <div className="card__body">
                  <p>{schema.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
