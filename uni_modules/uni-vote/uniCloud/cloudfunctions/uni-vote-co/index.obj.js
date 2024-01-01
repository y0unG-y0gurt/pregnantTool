// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj

// const {
// 	promises
// } = require("dns");

// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
const db = uniCloud.database();
const dbCmd = db.command;
const uniIdCommon = require('uni-id-common')
const checkRules = require('./checkRule.js')


// 导出模块
module.exports = {
	_before: async function() { // 通用预处理器
		// 获取客户端信息
		this.clientInfo = this.getClientInfo()

		// 定义uni-id公共模块对象
		this.uniIdCommon = uniIdCommon.createInstance({
			clientInfo: this.clientInfo
		})
		let res = await this.uniIdCommon.checkToken(this.clientInfo.uniIdToken)
		// 如果想自定义其他投票规则，可在这里写代码
		if (res.errCode) {
			// 如果token校验出错，则抛出错误
			throw res
		} else {
			// token通过校验，拿到此用户用户id
			this.current_uid = res.uid
		}
	},
	_after(error, result) {
		if (error) {
			console.log({
				error,
				result
			});
			if (error.errCode && error.errMsg) {
				// 符合响应体规范的错误，直接返回
				return error
			} else {
				throw error // 直接抛出异常
			}
		}
		return result
	},
	// 检查规则
	async checkConfig(vote_id) {
		return await checkRules(this.current_uid, vote_id)
	},
	// 获取最后一次投票记录
	async getLastRecords(vote_id) {
		// 当前问卷下的问题数量
		const {total} = await db.collection("uni-vote-questions").where({
			vote_id
		}).count()

		// 查当前用户最后一次投票记录
		const recordsList = await db.collection("uni-vote-records").aggregate()
			.match({
				"vote_id": vote_id,
				"user_id": this.current_uid
			})
			.lookup({
				from: 'uni-vote-questions-records',
				localField: '_id',
				foreignField: 'record_id',
				as: 'questionsRecordsList',
			})
			.sort({
				"create_date": -1
			})
			.limit(1)
			.end()

		// 获取当前用户问卷问题记录
		const questionsRecordsList = recordsList.data.length > 0 && recordsList.data[0].questionsRecordsList

		// 获取当前用户最后一次问卷问题回答记录
		let lastRecords = questionsRecordsList && total ? questionsRecordsList.slice(-total) : [];

		return {
			errCode: 0,
			errMsg: lastRecords.length > 0 ? '上一次投票记录' : '还没有投票记录',
			data: lastRecords //最后一次投票记录
		}
	},
	// 投票、提交问卷
	async handleVote(param) {
		let {chooseData,vote_id} = param
		// 检查规则
		let checkRulesRes = await checkRules(this.current_uid, vote_id)
		if (checkRulesRes.errCode) {
			return checkRulesRes
		}

		let recordsWhere = {
			"user_id": this.current_uid,
			"vote_id": vote_id,
		}
		//是否回答过
		const {
			data
		} = await db.collection("uni-vote-records").where(recordsWhere).field({
			"count": true
		}).get()


		let recordId;
		//已投票次数,处理投票记录
		if (data.length > 0 && data[0].count) {
			recordId = data[0]._id;
			// 回答过，update投票次数
			await db.collection('uni-vote-records').where(recordsWhere).update({
				"count": dbCmd.inc(1)
			})
		} else {
			// 没有回答过，add投票次数
			const addRecordRes = await db.collection('uni-vote-records').add({
				"user_id": this.current_uid,
				"vote_id": vote_id,
				"create_date": Date.now(),
				"count": 1
			})
			recordId = addRecordRes.id
		}


		let taskList = [];
		// 处理选项投票记录
		for (let key in chooseData) {

			// 多选
			if (Array.isArray(chooseData[key])) {
				chooseData[key].forEach(item => {
					taskList.push(
						db.collection("uni-vote-questions-options").where({
							"_id": item._id,
							"vote_question_id": key
						}).update({
							"count": dbCmd.inc(1)
						})
					)
				})
			}
			
			// 单选
			if (typeof chooseData[key] == 'object') {
				taskList.push(
					// 每个选项投票记录
					db.collection("uni-vote-questions-options").where({
						"_id": chooseData[key]._id,
						"vote_question_id": key
					}).update({
						"count": dbCmd.inc(1)
					})
				)
			}
			
			let voteQuestionRecord = {
				"user_id": this.current_uid,
				"vote_id": vote_id,
				"vote_question_id": key,
				"option_ids": chooseData[key],
				"record_id": recordId,
				"create_date": Date.now()
			}
			
			taskList.push(
				// 问题选项投票记录
				db.collection('uni-vote-questions-records').add(voteQuestionRecord)
			)
		}
		let res = await Promise.all(taskList)
		// console.log('res: ',res);

		const updateCount = res.reduce((acc, cur) => {
			if (cur.updated) {
				return acc + cur.updated;
			} else {
				return acc;
			}
		}, 0);
		return {
			errCode: 0,
			errMsg: updateCount > 0 ? '投票成功！' : '投票失败！'
		}
	},

	/* 以下为 admin 端调用的方法 */
	// 修改问题选项
	async handleVoteOptions(params) {
		let taskList = [];
		const sortOptions = params.options.sort((a, b) => a.index - b.index);
		sortOptions.forEach(item => {
			taskList.push(
				db.collection('uni-vote-questions-options').add({
					sort: item.index,
					title: item.title,
					status: 1,
					create_date: Date.now(),
					vote_id: params.vote_id,
					vote_question_id: params.vote_question_id,
					input_able: item.input_able ? item.input_able : false,
					input_value: ""
				})
			)
		})
		let res = await Promise.all(taskList)
		// 统计问题数
		await db.collection("uni-vote").doc(params.vote_id).update({
			"count": dbCmd.inc(1)
		})
		return {
			addCountRes: res.length
		}
	},
	// 删除
	async handleRemove(param) {
		let taskList = [];
		if (typeof param.removeIds == 'string') {
			taskList.push(
				db.collection(param.dbName).where({"_id": param.removeIds}).update({
					is_delete: true
				})
			)
		}

		if (Array.isArray(param.removeIds)) {
			param.removeIds.forEach(id => {
				taskList.push(
					db.collection(param.dbName).where({"_id": id}).update({
						is_delete: true
					})
				)
			})
		}
		let res = await Promise.all(taskList)
		return res
	}
}