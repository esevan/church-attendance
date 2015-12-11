var db_config = {
	host     : 'us-cdbr-iron-east-03.cleardb.net',
	user     : 'b884ba11ab5f27',
	password : '42d453a9',
	database: "heroku_08834d64f8b1271"
};

var db;

var mysql = require('mysql');

/* Heroku 서비스 mysql 이용시 필수 */
function handleDisconnect() {
	db = mysql.createConnection(db_config);
	db.connect(function(err) {
		if (err) {
			setTimeout(handleDisconnect, 2000);
		}
	});
	
	db.on('error', function(err) {
		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		} else {
			throw err;
		}
	});
}

handleDisconnect();

/* 장기 결석자 목록 (3주) */
exports.index = function(req, res){
	var query = "SELECT C.MEMBER_ID memberId, C.MEMBER_NM memberNm, C.PART_CD partCd, (SELECT ORDERBY_NO FROM CHOIR_PART D WHERE D.PART_CD=C.PART_CD) ORDERBY_NO,C.PHONE_NO phoneNo  FROM CHOIR_MEMBER C WHERE STATUS_CD='O' AND PART_CD !='E' AND NOT EXISTS ( SELECT A.MEMBER_ID FROM (SELECT MEMBER_ID, PRACTICE_DT, PRACTICE_CD FROM CHOIR_ATTENDANCE) A, (SELECT PRACTICE_DT, PRACTICE_CD FROM CHOIR_PRACTICE_INFO WHERE PRACTICE_CD='AM' AND LOCK_YN='Y' ORDER BY PRACTICE_DT DESC LIMIT 3) B WHERE A.PRACTICE_DT = B.PRACTICE_DT AND A.PRACTICE_CD = B.PRACTICE_CD AND C.MEMBER_ID = A.MEMBER_ID) ORDER BY ORDERBY_NO ASC";
	db.query(query, {}, function(err, rows){
		res.send(rows);
	});
};

/* 출석순위 */
exports.rank = function(req, res){

	var curDate = new Date();
	var curYear = curDate.getFullYear();
	var curMonth = (curDate.getMonth()+1);

	var startDt = '';
	var endDt = '';
	
	if(curMonth == 12) {
		startDt = curYear + "-12-01";
		endDt = (curYear+1) + "-11-30";
	} else {
		startDt = (curYear-1) + "-12-01";
		endDt = (curYear) + "-11-30";
	}

	var query = "  select * from ( "+
				"	select  "+
				"		MEMBER_ID   memberId, "+
				"		MEMBER_NM   memberNm, "+
				"		PART_CD     partCd, "+
				"		(SELECT POSITION_NM FROM CHOIR_POSITION CP WHERE CP.POSITION_CD = a.POSITION_CD) positionNm, "+
				"		(SELECT C_POSITION_NM FROM CHOIR_C_POSITION CP WHERE CP.C_POSITION_CD = a.C_POSITION_CD) cPositionNm, "+
				"		(select count(pi.PRACTICE_DT) sp from CHOIR_PRACTICE_INFO pi where pi.PRACTICE_DT between ? and ? and pi.PRACTICE_CD='AM' and pi.LOCK_YN='Y') amPracticeCnt, "+
				"		(select count(c.PRACTICE_DT) am from CHOIR_PRACTICE_INFO pi, CHOIR_ATTENDANCE c where pi.PRACTICE_DT between ? and ? and pi.PRACTICE_DT=c.PRACTICE_DT and pi.PRACTICE_CD=c.PRACTICE_CD and c.PRACTICE_CD='AM' and c.MEMBER_ID=a.MEMBER_ID and pi.LOCK_YN='Y') amCnt, "+
				"		(select count(pi.PRACTICE_DT) sp from CHOIR_PRACTICE_INFO pi where pi.PRACTICE_DT between ? and ? and pi.PRACTICE_CD='PM' and pi.LOCK_YN='Y') pmPracticeCnt, "+
				"		(select count(c.PRACTICE_DT) pm from CHOIR_PRACTICE_INFO pi, CHOIR_ATTENDANCE c where pi.PRACTICE_DT between ? and ? and pi.PRACTICE_DT=c.PRACTICE_DT and pi.PRACTICE_CD=c.PRACTICE_CD and c.PRACTICE_CD='PM' and c.MEMBER_ID=a.MEMBER_ID and pi.LOCK_YN='Y') pmCnt, "+
				"		(select count(pi.PRACTICE_DT) sp from CHOIR_PRACTICE_INFO pi where pi.PRACTICE_DT between ? and ? and pi.PRACTICE_CD='SP' and pi.LOCK_YN='Y') spPracticeCnt, "+
				"		(select count(c.PRACTICE_DT) sp from CHOIR_PRACTICE_INFO pi, CHOIR_ATTENDANCE c where pi.PRACTICE_DT between ? and ? and pi.PRACTICE_DT=c.PRACTICE_DT and pi.PRACTICE_CD=c.PRACTICE_CD and c.PRACTICE_CD='SP' and c.MEMBER_ID=a.MEMBER_ID and pi.LOCK_YN='Y') spCnt "+
				"	from "+
				"		CHOIR_MEMBER a "+
				"		where a.STATUS_CD='O' "+
				"	) m "+
				"	order by m.amCnt desc, m.pmCnt desc, m.spCnt desc, m.memberNm ";

	db.query(query, [
		startDt,
		endDt,
		startDt,
		endDt,
		startDt,
		endDt,
		startDt,
		endDt,
		startDt,
		endDt,
		startDt,
		endDt
	], function(err, rows){
		res.send(rows);
	});
};

/* 연습정보 목록 */
exports.attList = function(req, res){
	
	var page = req.params.page;
	var size = 50;
	var sRow = (page-1) * size;
	
	var query = "	   SELECT "+
                "	    i.PRACTICE_DT practiceDt,  "+
                "	    i.PRACTICE_CD practiceCd,  "+
                "	    i.MUSIC_INFO musicInfo,  "+
                "	    i.ETC_MSG etcMsg,  "+
                "	    i.LOCK_YN lockYn,  "+
                "	    IF(i.LOCK_YN='Y','마감',NULL) lockNm,  "+
                "	    p.PRACTICE_NM practiceNm, "+
		        "       (SELECT COUNT(*)  FROM CHOIR_ATTENDANCE ca, CHOIR_MEMBER cm WHERE     ca.MEMBER_ID = cm.MEMBER_ID and ca.PRACTICE_DT = i.PRACTICE_DT and ca.PRACTICE_CD = i.PRACTICE_CD and cm.PART_CD = 'S' ) s, "+
                "       (SELECT COUNT(*)  FROM CHOIR_ATTENDANCE ca, CHOIR_MEMBER cm WHERE     ca.MEMBER_ID = cm.MEMBER_ID and ca.PRACTICE_DT = i.PRACTICE_DT and ca.PRACTICE_CD = i.PRACTICE_CD and cm.PART_CD = 'A' ) a, "+
                "       (SELECT COUNT(*)  FROM CHOIR_ATTENDANCE ca, CHOIR_MEMBER cm WHERE     ca.MEMBER_ID = cm.MEMBER_ID and ca.PRACTICE_DT = i.PRACTICE_DT and ca.PRACTICE_CD = i.PRACTICE_CD and cm.PART_CD = 'T' ) t, "+
                "       (SELECT COUNT(*)  FROM CHOIR_ATTENDANCE ca, CHOIR_MEMBER cm WHERE     ca.MEMBER_ID = cm.MEMBER_ID and ca.PRACTICE_DT = i.PRACTICE_DT and ca.PRACTICE_CD = i.PRACTICE_CD and cm.PART_CD = 'B' ) b, "+
                "       (SELECT COUNT(*)  FROM CHOIR_ATTENDANCE ca, CHOIR_MEMBER cm WHERE     ca.MEMBER_ID = cm.MEMBER_ID and ca.PRACTICE_DT = i.PRACTICE_DT and ca.PRACTICE_CD = i.PRACTICE_CD and cm.PART_CD = 'E' ) e, "+
                "	    (select count(*) from CHOIR_ATTENDANCE a WHERE a.PRACTICE_DT=i.PRACTICE_DT and a.PRACTICE_CD=i.PRACTICE_CD) attendanceCnt "+
                "	  FROM CHOIR_PRACTICE_INFO i, CHOIR_PRACTICE p "+
                "	 WHERE i.PRACTICE_CD = p.PRACTICE_CD "+
                "	 ORDER BY i.PRACTICE_DT DESC , p.ORDERBY_NO DESC Limit ?,?";
	db.query(query, [sRow, size], function(err, rows){
		res.send(rows);
	});
};

/* 연습정보 상세(출석정보 포함) */
exports.attInfoDetail = function(req, res){

	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;

	var query = " SELECT "+
                "	    i.PRACTICE_DT practiceDt,  "+
                "	    i.PRACTICE_CD practiceCd,  "+
                "	    i.MUSIC_INFO musicInfo,  "+
                "	    i.ETC_MSG etcMsg,  "+
                "	    i.LOCK_YN lockYn, "+
                "	    p.PRACTICE_NM practiceNm, "+
                "	    (select count(*) from CHOIR_ATTENDANCE a WHERE a.PRACTICE_DT=i.PRACTICE_DT and a.PRACTICE_CD=i.PRACTICE_CD) attendanceCnt "+
                "	  FROM CHOIR_PRACTICE_INFO i, CHOIR_PRACTICE p "+
                "	 WHERE i.PRACTICE_CD = p.PRACTICE_CD "+
                "	   and i.PRACTICE_DT = ? and i.PRACTICE_CD = ? ";
	db.query(query, [practiceDt,practiceCd], function(err, row){		

		query = " select * from ( "+
                " 			select  "+
                " 			    MEMBER_ID   memberId, "+
                "                             (select IF(count(*)=0,'N','Y') from CHOIR_ATTENDANCE ca where ca.PRACTICE_DT=? and ca.PRACTICE_CD=? and ca.MEMBER_ID = a.MEMBER_ID) attYn, "+
                " 			    MEMBER_NM   memberNm, "+
                " 			    (SELECT C_POSITION_NM FROM CHOIR_C_POSITION CP WHERE CP.C_POSITION_CD = a.C_POSITION_CD) cPositionNm, "+
                " 			    PHONE_NO    phoneNo, "+
                " 			    PART_CD     partCd, "+
                " 			    (SELECT POSITION_NM FROM CHOIR_POSITION CP WHERE CP.POSITION_CD = a.POSITION_CD) positionNm, "+
                " 			    STATUS_CD   statusCd, "+
                " 			    (SELECT STATUS_NM FROM CHOIR_STATUS CS WHERE CS.STATUS_CD = a.STATUS_CD) statusNm, "+
                " 			    ETC_MSG     etcMsg "+
                " 			from "+
                " 			    CHOIR_MEMBER a "+
                "       ) m "+
                "         WHERE statusCd = ? "+
                "         AND partCd = ? "+
                "         order by memberNm ";

		db.query(query, [practiceDt,practiceCd,'O','S'], function(err, sList){
			db.query(query, [practiceDt,practiceCd,'O','A'], function(err, aList){
				db.query(query, [practiceDt,practiceCd,'O','T'], function(err, tList){
					db.query(query, [practiceDt,practiceCd,'O','B'], function(err, bList){
						db.query(query, [practiceDt,practiceCd,'O','E'], function(err, eList){
							query = " select * from ( "+
									" 			select  "+
									" 			    MEMBER_ID   memberId, "+
									"                             (select IF(count(*)=0,'N','Y') from CHOIR_ATTENDANCE ca where ca.PRACTICE_DT=? and ca.PRACTICE_CD=? and ca.MEMBER_ID = a.MEMBER_ID) attYn, "+
									" 			    MEMBER_NM   memberNm, "+
									" 			    (SELECT C_POSITION_NM FROM CHOIR_C_POSITION CP WHERE CP.C_POSITION_CD = a.C_POSITION_CD) cPositionNm, "+
									" 			    PHONE_NO    phoneNo, "+
									" 			    PART_CD     partCd, "+
									" 			    (SELECT POSITION_NM FROM CHOIR_POSITION CP WHERE CP.POSITION_CD = a.POSITION_CD) positionNm, "+
									" 			    STATUS_CD   statusCd, "+
									" 			    (SELECT STATUS_NM FROM CHOIR_STATUS CS WHERE CS.STATUS_CD = a.STATUS_CD) statusNm, "+
									" 			    ETC_MSG     etcMsg "+
									" 			from "+
									" 			    CHOIR_MEMBER a "+
									"       ) m "+
									"         WHERE statusCd = ? "+
									"         order by memberNm ";
							db.query(query, [practiceDt,practiceCd,'H'], function(err, hList){
								db.query(query, [practiceDt,practiceCd,'X'], function(err, xList){
									res.send({attInfo:row[0], s:sList, a:aList, t:tList, b:bList, e:eList, h:hList, x:xList});
								});					
							});					
						});					
					});					
				});
			});
		});
	});
};

/* 대원목록*/
exports.memberList = function(req, res){
	var query = 
                " 			select  "+
                " 			    MEMBER_ID   memberId, "+
                " 			    MEMBER_NM   memberNm, "+
                " 			    b.C_POSITION_NM cPositionNm, "+
                " 			    c.POSITION_NM positionNm "+
                " 			from "+
                " 			    choir_member a, "+
                " 			    CHOIR_C_POSITION b, "+
                " 			    CHOIR_POSITION c "+
                "         WHERE a.C_POSITION_CD = b.C_POSITION_CD AND a.POSITION_CD = c.POSITION_CD"+
                "         AND a.STATUS_CD = ? "+
                "         AND a.PART_CD = ? "+
                "         order by a.MEMBER_NM ";
	
	db.query(query, ['O', 'S'], function(err, sList){
		db.query(query, ['O', 'A'], function(err, aList){
			db.query(query, ['O', 'T'], function(err, tList){
				db.query(query, ['O', 'B'], function(err, bList){
					db.query(query, ['O', 'E'], function(err, eList){
						query = 
							" 			select  "+
			                " 			    MEMBER_ID   memberId, "+
			                " 			    MEMBER_NM   memberNm, "+
			                " 			    b.C_POSITION_NM cPositionNm, "+
			                " 			    c.POSITION_NM positionNm "+
			                " 			from "+
			                " 			    choir_member a, "+
			                " 			    CHOIR_C_POSITION b, "+
			                " 			    CHOIR_POSITION c "+
			                "         WHERE a.C_POSITION_CD = b.C_POSITION_CD AND a.POSITION_CD = c.POSITION_CD"+
			                "         AND a.STATUS_CD = ? "+
			                "         order by a.MEMBER_NM ";

						db.query(query, ['H'], function(err, hList){
							db.query(query, ['X'], function(err, xList){
								res.send({s:sList, a:aList, t:tList, b:bList, e:eList, h:hList, x:xList});
							});					
						});					
					});					
				});					
			});
		});
	});
};

/* 대원 상세정보 */
exports.member = function(req, res){
	
	var query = " select * from ( "+
	" 			select  "+
	" 			    MEMBER_ID   memberId, "+
	" 			    MEMBER_NM   memberNm, "+
	" 			    a.C_POSITION_CD   cPositionCd, "+
	" 			    (SELECT C_POSITION_NM FROM CHOIR_C_POSITION CP WHERE CP.C_POSITION_CD = a.C_POSITION_CD) cPositionNm, "+
	" 			    PHONE_NO    phoneNo, "+
	" 			    PART_CD     partCd, "+
	" 			    (SELECT PART_NM FROM CHOIR_PART CP WHERE CP.PART_CD = a.PART_CD) partNm, "+
	" 			    a.POSITION_CD     positionCd, "+
	" 			    (SELECT POSITION_NM FROM CHOIR_POSITION CP WHERE CP.POSITION_CD = a.POSITION_CD) positionNm, "+
	" 			    STATUS_CD   statusCd, "+
	" 			    (SELECT STATUS_NM FROM CHOIR_STATUS CS WHERE CS.STATUS_CD = a.STATUS_CD) statusNm, "+
	" 			    ETC_MSG     etcMsg "+
	" 			from "+
	" 			    choir_member a "+
	"       ) m "+
	"         WHERE memberId = ? ";
	
	db.query(query, [req.params.memberId], function(err, list){
		
		if(list.length != 0) {
			
			query = 
				"select distinct left(a.practice_dt, 7) month, a.practice_dt, a.practice_cd, b.member_id from " +
				"(select practice_dt, practice_cd from choir_practice_info) a left outer join  " +
				"( " +
				"select p.practice_dt, p.practice_cd, a.member_id " +
				"  from  " +
				"    choir_practice_info p inner join choir_attendance a " +
				"    on p.practice_dt = a.practice_dt and p.practice_cd = a.practice_cd " +
				"where  " +
				"  member_id = ? " +
				") b on a.practice_dt = b.practice_dt " +
				"where left(a.practice_dt, 7) >= (select min(left(practice_dt, 7)) as mm from choir_attendance where member_id= ?) " +
				"and left(a.practice_dt, 7) <= (select max(left(practice_dt, 7)) as mm from choir_attendance where member_id= ?) " +
				"order by month desc, practice_dt asc, practice_cd";
			
			db.query(query, [req.params.memberId,req.params.memberId,req.params.memberId], function(err, attMonthList){
				
				return res.send({member:list[0], attMonthList:attMonthList});
			});
		} else {
			return res.send(null);
		}
	});
};

/* 코드정보 */
exports.codeList = function(req, res){
	var query = "SELECT * FROM choir_c_position order by orderby_no";
	db.query(query, [req.params.memberId], function(err, cPositionList){
		var query = "SELECT * FROM choir_position order by orderby_no";
		db.query(query, [req.params.memberId], function(err, positionList){
			var query = "SELECT * FROM choir_part order by orderby_no";
			db.query(query, [req.params.memberId], function(err, partList){
				var query = "SELECT * FROM choir_practice order by orderby_no";
				db.query(query, [req.params.memberId], function(err, practiceList){
					var query = "SELECT * FROM choir_status order by orderby_no";
					db.query(query, [req.params.memberId], function(err, statusList){
						res.send({cPositionList:cPositionList, positionList:positionList, partList:partList, practiceList:practiceList, statusList:statusList});
					});
				});
			});
		});
	});
};

/* 마감처리 */
exports.lockAtt = function(req, res){
	
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;

	db.query("UPDATE CHOIR_PRACTICE_INFO SET LOCK_YN = 'Y' WHERE PRACTICE_DT = ? AND PRACTICE_CD = ? AND LOCK_YN = 'N'", [ practiceDt, practiceCd ], function(){
		res.send({result:'success'});
	});
}

/* 마감 취소 처리*/
exports.unlockAtt = function(req, res){
	
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;

	db.query("UPDATE CHOIR_PRACTICE_INFO SET LOCK_YN = 'N' WHERE PRACTICE_DT = ? AND PRACTICE_CD = ? AND LOCK_YN = 'Y'", [ practiceDt, practiceCd ], function(){
		res.send({result:'success'});
	});
}

/* 출석체크 */
exports.select = function(req, res){
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;
	var memberId = req.body.memberId;

	db.query("SELECT count(*) cnt FROM choir_attendance i WHERE i.PRACTICE_DT = ? and i.PRACTICE_CD = ? AND i.MEMBER_ID = ? ", [ practiceDt, practiceCd, memberId ], function(err, row){	

		if(row[0].cnt == 0) {
			db.query("INSERT INTO choir_attendance VALUES (?,?,?)", [ practiceDt, practiceCd, memberId ], function(){
				res.send({result:'success'});
			});
		} else {
			res.send({result:'success'});
		}
	});
}

/* 출석체크 해제 */
exports.deselect = function(req, res){
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;
	var memberId = req.body.memberId;

	db.query("DELETE FROM CHOIR_ATTENDANCE WHERE PRACTICE_DT = ? AND PRACTICE_CD = ? AND MEMBER_ID = ?", [ practiceDt, practiceCd, memberId ], function(){
		res.send({result:'success'});
	});
}

/* 연습곡 갱신 */
exports.saveMusicInfo = function(req, res){
	
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;
	var musicInfo = req.body.musicInfo;

	db.query("UPDATE CHOIR_PRACTICE_INFO SET MUSIC_INFO = ? WHERE PRACTICE_DT = ? AND PRACTICE_CD = ?", [ musicInfo,  practiceDt, practiceCd ], function(){
		res.send({result : "success"});
	});
}

/* 메모 갱신 */
exports.saveEtcMsg = function(req, res){
	
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;
	var etcMsg = req.body.etcMsg;

	db.query("UPDATE CHOIR_PRACTICE_INFO SET ETC_MSG = ? WHERE PRACTICE_DT = ? AND PRACTICE_CD = ?", [ etcMsg,  practiceDt, practiceCd ], function() {
		res.send({result : "success"});
	});
}

/* 연습정보 제거 */
exports.removeAttInfo = function(req, res){
	
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;
	
	db.query("DELETE FROM CHOIR_ATTENDANCE WHERE PRACTICE_DT = ? AND PRACTICE_CD = ?", [ practiceDt, practiceCd], function(){
		db.query("DELETE FROM CHOIR_PRACTICE_INFO WHERE PRACTICE_DT = ? AND PRACTICE_CD = ?", [ practiceDt, practiceCd],function(){
			res.send({result : "success"});
		});
	});
}

/* 연습정보 생성 */
exports.createPracticeInfo = function(req, res){
	
	var practiceDt = req.params.practiceDt;
	var practiceCd = req.params.practiceCd;
	var etgMsg = req.body.etgMsg;
	var musicInfo = req.body.musicInfo;
	
	db.query("SELECT count(*) cnt FROM CHOIR_PRACTICE_INFO i WHERE i.PRACTICE_DT = ? and i.PRACTICE_CD = ?", [ practiceDt, practiceCd ], function(err, row){	

		if(row[0].cnt == 0) {
			db.query("insert into CHOIR_PRACTICE_INFO(PRACTICE_DT, PRACTICE_CD, MUSIC_INFO, ETC_MSG) values(?,?,?,?)", [ practiceDt, practiceCd, musicInfo, etgMsg ], function(err, row){
				res.send({'result':'success'});	
			});
		} else {
			res.send({'result':'dup'});	
		}
	});
};

/* 회의록 목록*/
exports.docList = function(req, res){
	var query = "select MEET_SEQ meetSeq,MEET_DT meetDt,MEET_TITLE meetTitle,REPLACE(MEET_CONTENTS,'\n','<br/>') meetContents,REG_DT regDt,UPT_DT uptDt,LOCK_YN lockYn from MEETTING_DOC order by MEET_DT DESC, MEET_SEQ DESC";
	db.query(query, {}, function(err, rows){
		res.send(rows);
	});
};

/* 회의록 생성 */
exports.createDoc = function(req, res){
	var meetDt = req.body.meetDt;
	var meetTitle = req.body.meetTitle;
	var meetContents = req.body.meetContents;

	db.query("insert into MEETTING_DOC(MEET_DT, MEET_TITLE, MEET_CONTENTS, REG_DT, UPT_DT) values(?,?,?,current_timestamp,current_timestamp)", 
		[ meetDt, meetTitle, meetContents], function(){
		res.send({result:'success'});
	});
};

/* 회의록 상세정보*/
exports.modifyDoc = function(req, res){	
	var docId = req.params.docId;
	db.query("select MEET_SEQ meetSeq,MEET_DT meetDt,MEET_TITLE meetTitle,MEET_CONTENTS meetContents,REG_DT regDt,UPT_DT uptDt,LOCK_YN lockYn from meetting_doc where MEET_SEQ = ?", [ docId ], function(err, row){
		res.send(row[0]);
	});
};

/* 회의록 수정 */
exports.updateDoc = function(req, res){

	var meetDt = req.body.meetDt;
	var meetTitle = req.body.meetTitle;
	var meetContents = req.body.meetContents;
	var meetSeq = req.body.meetSeq;

	db.query("update MEETTING_DOC set MEET_DT = ?,MEET_TITLE = ?,MEET_CONTENTS = ?,UPT_DT = current_timestamp where MEET_SEQ = ?", 
		[ meetDt, meetTitle, meetContents, meetSeq], function(){
		res.send({result:'success'});	
	});
};

/*회의록 제거*/
exports.removeDoc = function(req, res){
	db.query("delete from MEETTING_DOC where MEET_SEQ = ?", [req.body.meetSeq], function(){
		res.send({result:'success'});
	});
};

/* 회의록 마감*/
exports.closeDoc = function(req, res){

	db.query("update MEETTING_DOC set LOCK_YN = 'Y' where MEET_SEQ = ?", [req.body.meetSeq], function(){
		res.send({result:'success'});	
	});
};

/* 대원정보 저장 */
exports.insertMember = function(req, res){
	
	var memberNm = req.body.memberNm;
	var cPositionCd = req.body.cPositionCd;
	var positionCd = req.body.positionCd;
	var phoneNo = req.body.phoneNo;
	var partCd = req.body.partCd;
	var statusCd = req.body.statusCd;
	var etcMsg = req.body.etcMsg;
	
	var query = "insert into CHOIR_MEMBER(MEMBER_NM,PHONE_NO,PART_CD,POSITION_CD,C_POSITION_CD,STATUS_CD,ETC_MSG,REG_DT,MODIFY_DT) values(?,?,?,?,?,?,?,current_timestamp,current_timestamp)";
    
	db.query(query, [ memberNm, phoneNo, partCd, positionCd, cPositionCd, statusCd, etcMsg ], function(){
		res.send({result : "success"});
	});
}
/* 대원정보 저장 */
exports.updateMember = function(req, res){
	
	var memberId = req.body.memberId;
	var memberNm = req.body.memberNm;
	var cPositionCd = req.body.cPositionCd;
	var positionCd = req.body.positionCd;
	var phoneNo = req.body.phoneNo;
	var partCd = req.body.partCd;
	var statusCd = req.body.statusCd;
	var etcMsg = req.body.etcMsg;
	
	var	query = "update choir_member"+
		"   set MEMBER_NM=?, C_POSITION_CD=?, PHONE_NO=?, PART_CD=?, POSITION_CD=?, STATUS_CD=?, ETC_MSG=?"+
		"   where MEMBER_ID=?";
		
	db.query(query, [ memberNm, cPositionCd, phoneNo, partCd, positionCd, statusCd, etcMsg, memberId ], function(){
		res.send({result : "success"});
	});
}