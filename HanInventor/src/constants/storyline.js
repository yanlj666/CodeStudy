export const storyline = [
  {
    title: '第一章：立足蜀中，获得信任',
    subStages: [
      {
        name: '安身立命',
        description: '解决蜀中百姓与军士的生存之忧，奠定立足之本。',
        powerThreshold: 0,
        tasks: [
          {
            description: '丞相府邸传来消息，今年的蜀中雨水过多，许多农具因潮湿而加速朽坏，来年春耕恐受影响，百姓忧心忡忡。你是否能构想一种更耐久的材料，或是一种能提升耕作效率的新式农具？',
            category: 'basic',
            reward: 50
          },
          {
            description: '军医处传来简报，军士在潮湿环境下，伤口极易感染恶化，非战斗减员日益增多。寻常的布帛和草药，已难堪大用。你是否有办法创造出更有效的清创和包扎之物？',
            category: 'basic',
            reward: 60
          }
        ]
      },
      {
        name: '改善品质',
        description: '在满足基本需求后，提高民生与生活质量。',
        powerThreshold: 200,
        tasks: [
          {
            description: '成都工坊制作的布帛粗糙，士绅不愿穿着。能否改良纺织工艺，使布帛更为细致？',
            category: 'basic',
            reward: 40
          },
          {
            description: '市井夜色昏暗，商贾苦于夜间无灯。若有长明之灯，可大增商贾之利。',
            category: 'luxury',
            reward: 70
          }
        ]
      },
      {
        name: '讨好权贵',
        description: '通过精巧奢华之物赢得上层青睐，巩固地位。',
        powerThreshold: 400,
        tasks: [
          {
            description: '丞相欲于府中设宴，需要一套能自鸣报时的机关，以示奇技。能否造出此物？',
            category: 'luxury',
            reward: 80
          },
          {
            description: '太守钟爱园林，渴望有自动浇灌之法，使花木常盛。',
            category: 'luxury',
            reward: 90
          }
        ]
      }
    ]
  }
];
