import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: 'SDK 사용법',
      items: [
        'sdk/overview',
        'sdk/python',
        'sdk/javascript',
        'sdk/decorators',
      ],
    },
    {
      type: 'category',
      label: '통합 가이드',
      items: [
        'integrations/overview',
        'integrations/openai',
        'integrations/langchain',
        'integrations/llamaindex',
        'integrations/anthropic',
      ],
    },
    'dashboard',
  ],
};

export default sidebars;
