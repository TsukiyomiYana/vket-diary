/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: '參展準備',
      collapsible: false,
      items: [
          'why-vket',
          'preparation',
          'pre-work',
          'vket-others',
      ],
    },
    {
      type: 'category',
      label: '製作・踩坑紀錄',
      collapsible: false,
      items: [
          'creation-process',
          'upload-process',
          'unity-package',
          'exhibition-world',
      ],
    },
    {
      type: 'category',
      label: '販售・宣傳與資料備忘錄',
      collapsible: false,
      items: [
          'booth-link',
          'promotion',
          'tools-and-materials',
          'official-paper',
          'special-thanks',
      ],
    },
    {
      type: 'category',
      label: 'DLC : 展示空間的小彩蛋',
      collapsible: false,
      items: [
          'dlc-gimmick',
      ],
    },
  ],
};

export default sidebars;
