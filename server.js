const express = require('express')
const app = express()

const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);






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
  db = client.db('todoapp');  //todoapp이라는 database(폴더)에 연결!

  http.listen(process.env.PORT, function() {
    console.log('listening on 8080')
  })

  
  

})





app.get('/', function(요청, 응답) { 
  응답.render('index.ejs')
  
})

app.get('/write', function(요청, 응답) { 
  응답.render('write.ejs')
    
});


app.get('/chat',function(요청, 응답){
  응답.render('chat.ejs')
})

//socket
io.on('connection', function(socket){
  //어떤 인간이 웹소켓 연결했을 때 실행해주세요.
  console.log('연결되었어요!');

  //수신코드 작성하기
  
  socket.on('인삿말', function(data){
    console.log(data)
    //고객이 보낸 데이타도 출력할 수 있다!
    //문자를 보내면 페이지에 접속하는 모든 사람들한테
            //데이터를 보내줘야 함.
    io.emit('퍼트리기', data);
  })

});

//네임스페이스 만들기 
// /채팅방 << namespace 
// namepsace에 접속한 사람들끼리만 대화 가능
// 단점 -> 누구나 참여할 수 있다.
// 서버가 제약을 걸 수 없다??


var chat1 = io.of('/채팅방1')
chat1.on('connection', function(socket){


  var 방번호 = '';

  socket.on('방들어가고픔',function(data){
    //비밀번호 맞으면 조인시켜주세요~~

    //data에 적어주면 된다! obj 들어갈 수 있음ㅇㅇ

    socket.join(data);
    방번호 = data;
  })




  socket.on('인삿말', function(data){
    console.log(data)

    //아래 코드는 동작 안 함.
   /*  io.emit('퍼트리기', data); */
    chat1.to(방번호).emit('퍼트리기',data);

    // to =>정확히 어디로 보낼지 설정
  })
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
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: 요청.query.value,
          path: ['title','date']  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort : { _id : 1 }},
    { $limit : 10 }, //제한 걸 수 있음 10개까지만!
    //어떤 정보를 숨길지 결정!
    { $project: { title: 1, _id: 0, score: { $meta: "searchScore" } }}
] 
  db.collection('post').aggregate(검색조건).toArray((에러,결과)=>{
    console.log(결과)
    응답.render('search.ejs',{ posts:결과 })

    //정확히 일치하는 것만 찾아줌.
    //정규식을 써서 해결하기

    //띄어쓰기 기준으로 정렬하기 때문에 몽고DB로는 한국어 단어 포함된 문장 검색이 어려움
    //해결책 ->> text index 쓰지 말고 검색할 문서의 양을 제한하기 
    //해결책2 ->>

  });
});









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
  console.log(next)
  if(요청.user){
    next()
    console.log(next)
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





//회원기능이 필요하면 passport 셋팅하는 부분이 위에 있어야 함.

app.post('/register',function(요청,응답){
  //id가 이미 있는지 확인, id에 알파벳 숫자만 들어있나, 비번 저장 전에 암호화
  db.collection('login').insertOne({ id: 요청.body.id, pw: 요청.body.pw },function(에러,결과){
    응답.redirect('/');
  })
})


app.post('/add', function(요청, 응답){
  
  응답.send('전송완료')
  db.collection('counter').findOne({name: '게시물갯수'}, function(에러, 결과){
    console.log(결과.totalPost)
    var 총게시물갯수 = 결과.totalPost;


    var 저장할거 = {_id:총게시물갯수+1,작성자 : 요청.user._id ,title:요청.body.title,date:요청.body.date}
    //데이터 저장할 때 작성자도 추가하자.

    db.collection('post').insertOne(저장할거,function(에러, 결과){
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



app.delete('/delete',function(요청,응답){
  console.log(요청.body)
  요청.body._id = parseInt(요청.body._id)

  var 삭제할데이터 = { _id : 요청.body._id, 작성자 : 요청.user._id }

  //요청.body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제해 주세요.
  db.collection('post').deleteOne(삭제할데이터,function(에러,결과){
    console.log('삭제완료');
    if(에러){console.log(에러)}
    응답.status(200).send({message:'성공했습니다'});
  })
})

//로그인한 사람만 접속하게! (미들웨어 역할)
app.use('/shop', 로그인했니, require('./routes/shop'));
app.use('/board/sub', 로그인했니, require('./routes/sports'));
//고객이 / 경로로 요청했을 때 이런 미들웨어를 적용해주세요! router를 적용해주세요.


// multer -> 파일 전송한 거 쉽게 저장시키고 분석하도록 도와주는 라이브러리

//multer 불러오기
let multer = require('multer');
//diskStorage 그냥 일반 하드에 저장해주세요.
//memoryStorage 메모리에 저장해주세요(휘발성)
var storage = multer.diskStorage({
  destination : function(req, file, cb){
    cb(null, './public/image')
    //이미지 저장경로 지정!
  },
  filename : function(req, file, cb){
    cb(null, file.originalname)
    //파일명 지정 가능 
  },
  
});

var upload = multer({storage : storage});

//이미지 업로드 시 multer 동작시키기



app.get('/upload',function(요청, 응답){
  응답.render('upload.ejs')
});


app.post('/upload', upload.single('프로필'), function(요청,응답){
  응답.send('업로드 완료')
});

app.get('/image/:imageName',function(요청,응답){
  응답.sendFile(__dirname+'/public/image/'+ 요청.params.imageName)
})



//채팅은 get/post 이런걸로 하지 않음. 무거움
//간단한 문자만 주고 받고 싶을 때는 web socket 이용함!
//최신 브라우저에서만 이용할 수 있다. 
//호환성 생각하면 socket.ion를 쓴다!

