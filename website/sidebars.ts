import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      collapsed: false,
      items: [
        'introduction/index',
        'introduction/motivation',
        'introduction/design-principles',
      ],
    },
    {
      type: 'category',
      label: 'Theory',
      items: [
        'theory/completeness',
        'theory/minimality',
        'theory/completeness-gap',
        'theory/equivalence',
      ],
    },
    {
      type: 'category',
      label: 'The Graph',
      items: [
        'graph/structure',
        'graph/node-types-overview',
        'graph/edge-types',
        'graph/features-and-namespaces',
      ],
    },
    {
      type: 'category',
      label: 'Node Types',
      collapsed: true,
      items: [
        'node-types/behavior',
        'node-types/decision',
        'node-types/domain',
        'node-types/constraint',
        'node-types/feature',
        'node-types/extensions',
      ],
    },
    {
      type: 'category',
      label: 'Authoring',
      collapsed: true,
      items: [
        'authoring/writing-nodes',
        'authoring/atomicity-rules',
        'authoring/when-to-add-nodes',
        'authoring/directory-layout',
      ],
    },
    {
      type: 'category',
      label: 'Manifestation',
      collapsed: true,
      items: [
        'manifestation/overview',
        'manifestation/orient-scaffold-implement',
        'manifestation/context-assembly',
        'manifestation/verification',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      items: [
        'guides/getting-started',
        'guides/progressive-adoption',
        'guides/from-dloop-v1',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: [
        'reference/json-schemas',
        'reference/examples',
        'reference/glossary',
        'reference/comparison',
      ],
    },
  ],
};

export default sidebars;
