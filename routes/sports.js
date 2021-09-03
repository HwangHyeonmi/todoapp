var router = require('express').Router();

function 로그인했니(요청, 응답, next){
    //로그인 후 세션이 있으면 요청.user가 항상 있음.
    console.log(next)
    if(요청.user){
      next()
      console.log(next)
    }else{
      응답.send('로그인 안하셨는데요?')
    }
  }

  //아래에 있는 모든 url에 적용할 미들웨어
router.use(로그인했니);

router.get('/sports', function(요청, 응답){
    응답.send('스포츠겟판')
  })
  
router.get('/game',function(요청, 응답){
응답.send('게임겟판')
})

module.exports = router;