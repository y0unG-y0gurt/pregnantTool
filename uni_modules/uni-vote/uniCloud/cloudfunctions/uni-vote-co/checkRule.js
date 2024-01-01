const db = uniCloud.database()
const dbCmd = db.command;

// 投票规则检验
module.exports = async function(current_uid, vote_id) {
	
	// 你可以自定义一些规则，遵循以下格式，可参考规则：晚上8点后到早上8点，期间不能投票
	let res = {
		errCode: 0,
		errMsg: '',
		data: {} //限制规则
	}
	
	// 执行限制：新用户投票时间
	//await newUserDisableRule()
	if (res.errCode) {
		return res
	}

	// 执行限制：晚上8点后到早上8点，期间不能投票
	// await disableInNightRule()
	// if(res.errCode){
	// 	return res
	// }

	// 执行多问题问卷投票次数限制
	await multipleVoteRule()
	if (res.errCode) {
		return res
	}

	// 执行单问题问卷投票次数限制
	await singleVoteRule()
	if (res.errCode) {
		return res
	}

	return res //最后返回res，res.data可能包含一些规则


	// 晚上8点后到早上8点，期间不能投票
	async function disableInNightRule(){
		const now = new Date();
		const hour = now.getHours();
		if (hour >= 20 || hour < 8) {
		  res.errCode = "uni-vote-disable-night"
		  res.errMsg = "现在是晚上8点到早上8点之间，禁止投票！"
		} else {
		  console.log("现在不是晚上8点到早上8点之间");
		} 
	}

	// 限制新用户投票时间函数
	async function newUserDisableRule() {
		//新用户禁止投票限制，以下表示：禁止注册时间在4小时内的新用户投票
		const newUserDisablePeriod = 1; //禁止投票时间
		const newUserDisablePeriodUnit = "分钟"; //禁止投票时间单位，可选"年"、"月"、"天"、"小时"、"分钟"

		let pastTime = getPastTimestamp(newUserDisablePeriod, newUserDisablePeriodUnit);

		const userInfo = await db.collection("uni-id-users").where({
			"_id": current_uid,
			"register_date": dbCmd.lte(pastTime)
		}).get()
		
		
		res.data.newUserDisablePeriod = newUserDisablePeriod
		res.data.newUserDisablePeriodUnit = newUserDisablePeriodUnit

		if (!userInfo.data.length) {
			res.errCode = "uni-vote-user-disable",
			res.errMsg = `禁止注册时间在${newUserDisablePeriod}${newUserDisablePeriodUnit}内的新用户投票，请稍后再试！`
		}
	}


	// 多问题问卷投票次数函数
	async function multipleVoteRule() {
		// 多问题问卷投票次数，以下表示：每个问卷每个用户只能投票1次
		const multipleVoteMaxCount = 1; //问卷参数次数
		// 当前问卷下的问题数量
		const {
			total
		} = await db.collection("uni-vote-questions").where({
			vote_id
		}).count()
		// 多问题问卷
		if (total > 1 && multipleVoteMaxCount) {
			// 查当前用户在此问卷下投票次数
			const {
				data
			} = await db.collection("uni-vote-records").where({
				"user_id": current_uid,
				"vote_id": vote_id
			}).field({
				"count": true
			}).get()
			let ableVoteCount, usedVoteCount; //ableVoteCount剩余可用投票次数 ，usedVoteCount已投票次数
			// 已投票次数
			if (data.length > 0) {
				usedVoteCount = data[0].count
			} else {
				usedVoteCount = 0
			}
			// 可用投票次数 = 总可用投票次数 - 已投票次数
			ableVoteCount = multipleVoteMaxCount - usedVoteCount
			res.data.multipleVoteMaxCount = multipleVoteMaxCount
			if (ableVoteCount < 0 || ableVoteCount == 0) {
				res.errCode = "uni-vote-multiple-max-count",
				res.errMsg = `投票次数已用完！禁止投票！`
				res.data.ableVoteCount = 0
			} else {
				res.data.ableVoteCount = ableVoteCount
			}
		}
	}

	//单问题问卷投票次数函数
	async function singleVoteRule() {
		//单问题问卷投票次数，以下表示：每个问卷每个用户，1个月内，最多投票2次
		let singleVoteMaxCount = 1; //周期内投票次数限制
		let singleVotePeriod = 1; //周期值
		let singleVotePeriodUnit = "个月"; //投票周期单位，可选"年"、"个月"、"天"、"小时"、"分钟"
		let hasSingleVoteConfig = singleVoteMaxCount > 0 && singleVotePeriod > 0 && singleVotePeriodUnit
		// 当前问卷下的问题数量
		const {
			total
		} = await db.collection("uni-vote-questions").where({
			vote_id
		}).count()
		// 单问题问卷，有配置
		if (total == 1 && hasSingleVoteConfig) {
			let pastTimestamp = getPastTimestamp(singleVotePeriod, singleVotePeriodUnit);
			// 查当前用户在此问卷下，本周期内投票次数
			const {
				data
			} = await db.collection("uni-vote-records").where({
				"user_id": current_uid,
				"vote_id": vote_id,
				"create_date": dbCmd.gte(pastTimestamp).and(dbCmd.lte(Date.now()))
			}).field({
				"count": true
			}).get()
			
			let ableVoteCount, usedVoteCount; //ableVoteCount剩余可用投票次数 ，usedVoteCount已投票次数
			// 已投票次数
			if (data.length > 0) {
				usedVoteCount = data[0].count
			} else {
				usedVoteCount = 0
			}
			// 可用投票次数 = 总可用投票次数 - 已投票次数
			ableVoteCount = singleVoteMaxCount - usedVoteCount


			res.data.singleVoteMaxCount = singleVoteMaxCount
			res.data.singleVotePeriod = singleVotePeriod
			res.data.singleVotePeriodUnit = singleVotePeriodUnit

			if (ableVoteCount < 0 || ableVoteCount == 0) {
				res.errCode = "uni-vote-single-max-count"
				res.errMsg = "投票次数已用完！禁止投票，请在下个周期内重试！"
				res.data.ableVoteCount = 0
			} else {
				res.data.ableVoteCount = ableVoteCount
			}
		}
	}

}

/**
 * 获取过去时间戳
 * @param {Number} timePeriod 周期值
 * @param {string} timeUnit 周期单位，可选"年"、"个月"、"天"、"小时"、"分钟"
 */
function getPastTimestamp(timePeriod, timeUnit) {
	const now = new Date().getTime();
	let past;
	switch (timeUnit) {
		case '年':
			past = now - timePeriod * 365 * 24 * 60 * 60 * 1000;
			break;
		case '个月':
			past = now - timePeriod * 30 * 24 * 60 * 60 * 1000;
			break;
		case '天':
			past = now - timePeriod * 24 * 60 * 60 * 1000;
			break;
		case '小时':
			past = now - timePeriod * 60 * 60 * 1000;
			break;
		case '分钟':
			past = now - timePeriod * 60 * 1000;
			break;
		default:
			return undefined; // 返回 undefined 表示无法计算时间戳
	}
	return past;
}