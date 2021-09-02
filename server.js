const express = require('express')
const app = express()
app.use(express.urlencoded({extended: true}))
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.set('view engine', 'ejs');
//ejs로 쓴 html을 노드 js가 렌더링ㅇ 해줌.

app.use('/public', express.static('public'))

require('dotenv').config()

var db;
var url = process.env.DB_URL
var title;
var date;

MongoClient.connect(url, { useUnifiedTopology: true }, function(에러,client){
  if(에러) return console.log(에러)

  app.listen(process.env.PORT, function() {
    console.log('listening on 8080')
  })

  db = client.db('todoapp');  //todoapp이라는 database(폴더)에 연결!
  

})


app.post('/add', function(요청, 응답){
  응답.send('전송완료')
  db.collection('counter').findOne({name: '게시물갯수'}, function(에러, 결과){
    console.log(결과.totalPost)
    var 총게시물갯수 = 결과.totalPost;

    db.collection('post').insertOne({_id:총게시물갯수+1,title:요청.body.title,date:요청.body.date},function(에러, 결과){
      console.log('저장완료');

       //totalPost라는 항목도 1증가시켜야 함.
       //데이터 수정할 때 operator를 써야 함. 중괄호 안에 중괄호! $set <<같은 것이 operator!!!
       // $set은 바꿔주는 거, $inc는 증가시키는 거, 
      db.collection('counter').updateOne({name:'게시물갯수'},{$inc:{totalPost:1}},function(에러,결과){
      console.log('수정완료')
    })
    });


   
  });

  
});


app.get('/', function(요청, 응답) { 
  응답.render('index.ejs')
  
})

app.get('/write', function(요청, 응답) { 
  응답.render('write.ejs')
    
});

app.get('/list',function(요청,응답){
  //디비에 저장된 post라는 collection 안의 '특정' 데이터를 꺼내주세요.

  // 모든 데이터를 꺼내 주세요.

  db.collection('post').find().toArray(function(에러,결과){
    응답.render('list.ejs',{posts: 결과});
  });

});


app.get('/search',(요청,응답)=>{
  console.log(요청.query.value)
  
  db.collection('post').find({title:/요청.query.value/}).toArray((에러,결과)=>{
    console.log(결과)
    응답.render('search.ejs',{posts:결과})

    //정확히 일치하는 것만 찾아줌.
    //정규식을 써서 해결하기

  });
});




app.delete('/delete',function(요청,응답){
  console.log(요청.body)
  요청.body._id = parseInt(요청.body._id)
  //요청.body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제해 주세요.
  db.collection('post').deleteOne(요청.body,function(에러,결과){
    console.log('삭제완료');
    응답.status(200).send({message:'성공했습니다'});
  })
})


//   /detail로 접속하면 detail.ejs로 보여줌

app.get('/detail/:id', function(요청, 응답){
  db.collection('post').findOne({_id : parseInt(요청.params.id)}, function(에러,결과){
    console.log(결과)
    응답.render('detail.ejs', { data : 결과 })
  })
  

})

app.get('/edit/:id',function(요청,응답){

  db.collection('post').findOne({_id : parseInt(요청.params.id)},function(에러,결과){
    console.log(결과)
    응답.render('edit.ejs',{data: 결과})
  })
  
})


app.put('/edit', function(요청, 응답){
  console.log(요청.body)
db.collection('post').updateOne({ _id: parseInt(요청.body.id)},{ $set: {title:요청.body.title,date:요청.body.date}},function(에러,결과){
  console.log('수정완료입니다')
  응답.redirect('/list')
  //응답은 무조건 적어야 함. 응답 안 적으면 페이지가 멈춤
})
 
});


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret:'비밀코드',resave:true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

//app.use <-미들웨어를 쓰겠다는 뜻. 웹사이트는 요청과 응답을 해주는 기계인데,,
//요청과 응답 중간에 동작을 실행시키고 싶을 때 app.use를 쓴다! 그럼 요청과 응답 사이에 use 내의 코드가 실행됨!

app.get('/login',function(요청,응답){
  응답.render('login.ejs')
})

app.post('/login', passport.authenticate('local',{
  failureRedirect : '/fail'
}),function(요청,응답){
  응답.redirect('/')
});



app.get('/mypage',로그인했니, function(요청,응답){
  // 요청.user <deserialize에서 찾은 정보가 다 들어있다.
  console.log(요청.user)
  응답.render('mypage.ejs',{사용자 : 요청.user})
});


function 로그인했니(요청, 응답, next){
  //로그인 후 세션이 있으면 요청.user가 항상 있음.
  if(요청.user){
    next()
  }else{
    응답.send('로그인 안하셨는데요?')
  }
}



passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false, //true로 바꾸면 검증 시 추가 정보 입력 가능.
}, function (입력한아이디, 입력한비번, done) {

  //done() 세개의 파라미터. 첫번째는 서버에러, 두번째는 성공시 DB, 세번짼 메세지
  console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

//로그인 성공 ->세션 정보를 만듦.

passport.serializeUser(function(user,done){
  done(null,user.id)
});


passport.deserializeUser(function(아이디,done){
  //로그인한 유저의 개인정보를 DB에서 찾는 역할
  //id, pw 외의 다양한 정보를 쓸 수 있다.
  //디비에서 위에 있는 user.id로 유저를 찾은 뒤에
  //유저 정보를 두번째 파라미터에 넣음! 
  db.collection('login').findOne({id: 아이디},function(에러,결과){
    done(null,결과)
  })
  
})

