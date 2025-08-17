// AI工具定义库 - 定义Function Calling工具结构

/**
 * 发明蓝图保存工具
 * 用于AI调用以保存发明结果到游戏状态
 */
export const inventionTool = {
  type: "function",
  function: {
    name: "saveInventionBlueprint",
    description: "保存发明蓝图到游戏系统，用于记录AI生成的发明成果",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "发明的古雅名称，如：天工开物·某某器"
        },
        description: {
          type: "string",
          description: "详细的发明描述，包括原理、制作方法、使用效果等，语言要有古韵但易懂"
        },
        nationalPowerIncrease: {
          type: "integer",
          description: "对国力的提升数值，范围10-200之间",
          minimum: 10,
          maximum: 200
        },
        category: {
          type: "string",
          description: "发明类别",
          enum: ["农具", "兵器", "医药", "工艺", "机械", "建筑", "交通", "其他"]
        },
        materials: {
          type: "array",
          description: "所需材料清单",
          items: {
            type: "string"
          }
        },
        impact: {
          type: "string",
          description: "对社会的具体影响描述"
        }
      },
      required: ["name", "description", "nationalPowerIncrease", "category", "materials", "impact"]
    }
  }
};

/**
 * 机遇任务生成工具
 * 用于AI调用以生成新的机遇任务
 */
export const questTool = {
  type: "function",
  function: {
    name: "generateQuestTask",
    description: "生成新的机遇任务，为玩家提供发明灵感",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "机遇任务的标题"
        },
        description: {
          type: "string",
          description: "机遇任务的详细描述"
        },
        difficulty: {
          type: "string",
          description: "任务难度等级",
          enum: ["简单", "中等", "困难", "极难"]
        },
        category: {
          type: "string",
          description: "任务类别",
          enum: ["军事", "民生", "农业", "工艺", "医疗", "建筑", "其他"]
        },
        reward: {
          type: "integer",
          description: "完成任务的潜在国力奖励",
          minimum: 5,
          maximum: 100
        }
      },
      required: ["title", "description", "difficulty", "category", "reward"]
    }
  }
};

/**
 * 获取所有可用工具的数组
 * @returns {Array} 工具定义数组
 */
export function getAllTools() {
  return [inventionTool, questTool];
}

/**
 * 获取发明相关工具
 * @returns {Array} 发明工具数组
 */
export function getInventionTools() {
  return [inventionTool];
}

/**
 * 获取机遇相关工具
 * @returns {Array} 机遇工具数组
 */
export function getQuestTools() {
  return [questTool];
}

/**
 * 处理工具调用结果
 * @param {string} toolName - 工具名称
 * @param {Object} parameters - 工具参数
 * @returns {Object} 处理结果
 */
export function handleToolCall(toolName, parameters) {
  switch (toolName) {
    case 'saveInventionBlueprint':
      return {
        success: true,
        message: '发明蓝图已保存',
        data: parameters
      };
    
    case 'generateQuestTask':
      return {
        success: true,
        message: '机遇任务已生成',
        data: parameters
      };
    
    default:
      return {
        success: false,
        message: `未知的工具调用: ${toolName}`,
        data: null
      };
  }
}