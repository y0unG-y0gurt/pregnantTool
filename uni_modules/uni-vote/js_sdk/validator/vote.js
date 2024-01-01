// 表单校验规则由 schema2code 生成，不建议直接修改校验规则，而建议通过 schema2code 生成, 详情: https://uniapp.dcloud.net.cn/uniCloud/schema


const validator = {
  "name": {
    "rules": [
      {
        "required": true
      },
      {
        "format": "string"
      }
    ],
    "label": "问题"
  },
  "description": {
    "rules": [
      {
        "format": "string"
      }
    ],
    "label": "简介"
  },
  "sort": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "label": "排序"
  },
  "count": {
    "rules": [
      {
        "format": "int"
      }
    ],
    "label": "投票项总数",
    "defaultValue": 0
  },
  "items_type": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 0,
            "text": "单选"
          },
          {
            "value": 1,
            "text": "多选"
          }
        ]
      }
    ],
    "label": "选项类型",
    "defaultValue": 1
  },
  "status": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 0,
            "text": "关闭"
          },
          {
            "value": 1,
            "text": "启用"
          }
        ]
      }
    ],
    "label": "状态",
    "defaultValue": 1
  },
  "period_of_validity": {
    "rules": [
      {
        "format": "int"
      },
      {
        "range": [
          {
            "value": 0,
            "text": "长期"
          },
          {
            "value": 1,
            "text": "时间段"
          }
        ]
      }
    ],
    "label": "有效期",
    "defaultValue": 0
  },
  "start_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "label": "开始时间"
  },
  "end_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "label": "结束时间"
  },
  "create_date": {
    "rules": [
      {
        "format": "timestamp"
      }
    ],
    "label": "创建时间"
  }
}

const enumConverter = {
  "items_type_valuetotext": {
    "0": "单选",
    "1": "多选"
  },
  "status_valuetotext": {
    "0": "关闭",
    "1": "启用"
  },
  "period_of_validity_valuetotext": {
    "0": "长期",
    "1": "时间段"
  }
}

function filterToWhere(filter, command) {
  let where = {}
  for (let field in filter) {
    let { type, value } = filter[field]
    switch (type) {
      case "search":
        if (typeof value === 'string' && value.length) {
          where[field] = new RegExp(value)
        }
        break;
      case "select":
        if (value.length) {
          let selectValue = []
          for (let s of value) {
            selectValue.push(command.eq(s))
          }
          where[field] = command.or(selectValue)
        }
        break;
      case "range":
        if (value.length) {
          let gt = value[0]
          let lt = value[1]
          where[field] = command.and([command.gte(gt), command.lte(lt)])
        }
        break;
      case "date":
        if (value.length) {
          let [s, e] = value
          let startDate = new Date(s)
          let endDate = new Date(e)
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
      case "timestamp":
        if (value.length) {
          let [startDate, endDate] = value
          where[field] = command.and([command.gte(startDate), command.lte(endDate)])
        }
        break;
    }
  }
  return where
}

export { validator, enumConverter, filterToWhere }
