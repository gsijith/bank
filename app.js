const express = require('express');
const session=require('express-session');
const app = express();
const conn = require("./db");
const port = 3000
const getRandomInteger = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
};

app.use(session({
    secret:'ABCD123',
    resave:false,
    saveUninitialized:true
}));

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/login', (req, res) => {
    res.render('login')
});

app.post('/login',(req,res)=>{
const uname=req.body.username;
const pass=req.body.password;

const query='SELECT * FROM `users` WHERE username=? AND password=?';

conn.query(query,[uname,pass],(err,result)=>{
    if(err) throw err;

    if(result.length>0){
        req.session.users={
            uname:result[0].username,
            Acc_no:result[0].Acc_no,
            fname:result[0].firstname,
            lname:result[0].lastname,
            address:result[0].address,
            dob:result[0].dob,
            account:result[0].account,
            phone:result[0].phone,
            branch:result[0].branch,
            ifsc_no:result[0].ifsc_no,
            email:result[0].email
        };
        res.redirect('/mainpg');
    }
    else{
        res.send('Invalid username or password');
    }
});
});

app.get('/register', (req, res) => {
    res.render('register')
});


app.post('/submit', (req, res) => {
    
    const { firstname, lastname, email, phn, dob, place, pcode, addr, type, uname, pass } = req.body;
    const sql='SELECT `username` FROM users WHERE `username`=?';
    conn.query(sql,[uname], (err, result1)=>{
        if (err) {
            console.error('Error in MySQL:', err);
            res.send('Error in MySQL');
            return;
        }
        if(result1.length>0){
            res.send('user exist');
        }
        else{
            const min = 10000000000;
            const max = 99999999999;
            const u_id = getRandomInteger(min, max);
        
        
            const min2 = 1000000;
            const max2 = 9999999;
            const ifsc = "SBI" + getRandomInteger(min2, max2);
        
            const sql2 = 'INSERT INTO users (Acc_no,username,password,firstname, lastname, email,phone,dob,branch,pincode,address,account,ifsc_no) VALUES (?, ?, ?,?,?,?,?,?,?,?,?,?,?)';
            conn.query(sql2, [u_id, uname, pass, firstname, lastname, email, phn, dob, place, pcode, addr, type, ifsc], (err, result) => {
                if (err) {
                    console.error('Error inserting data into MySQL:', err);
                    res.send('Error inserting data into MySQL');
                    return;
                }
                res.send('Data inserted into MySQL');
            });
        }
    });


  
});

app.get('/mainpg', (req, res) => {
    const data=req.session.users;
    if(data){
        res.render('samplefile',{user:req.session.users});
    }
    else{
        res.redirect('/login');
    }
});

app.get('/transfer', (req, res) => {
    const data=req.session.users;

   
    if(data){
        const uacc=data.Acc_no;
        const query='SELECT * FROM history WHERE payee=? OR recipient=?';

        conn.query(query,[uacc,uacc],(err,results)=>{
            
            const userpayments=results;
            res.render('transferhistory',{userpayments});
        })
    }
    else{
        res.redirect('/login');
    }
});


app.post('/transfer', (req, res) => {
    const data=req.session.users;

   
    if(data){
        const {search}=req.body;
        const uacc=data.Acc_no;
        const query='SELECT * FROM history WHERE (payee=? OR recipient=?) AND Transaction_ID=?';

        conn.query(query,[uacc,uacc,search],(err,results)=>{
            
            const userpayments=results;
            res.render('transferhistory',{userpayments});
        })
    }
    else{
        res.redirect('/login');
    }
});


app.get('/payment', (req, res) => {
    const data=req.session.users;
    if(data){
        res.render('payment',{user:req.session.users});
    }
    else{
        res.redirect('/login');
    }
 
});

app.post('/payment',(req,res)=>{
    const data=req.session.users;
    const urname=data.uname;

    const min2 = 1000;
    const max2 = 9999;
    const tid = "TAN" + getRandomInteger(min2, max2);

    const date= new Date();

    const { amount,acc,desc } = req.body;

    const query='SELECT * FROM users WHERE Acc_no=?';
    conn.query(query,[acc], (err, result)=>{
        if (err) {
            console.error('Error in MySQL:', err);
            res.send('Error in MySQL');
            return;
        }
        if(result.length>0){
            const payee=data.Acc_no;
           const r_uname=result[0].username;
            const p_amount="-"+amount;
            const r_amount="+"+amount;
            const empty="";
           const query1='INSERT INTO history(Transaction_ID,payee,recipient,Date,Description,payee_amount,reci_amount) VALUES (?, ?, ?,?,?,?,?)';
            conn.query(query1,[tid,payee,r_uname,date,desc,p_amount,empty],(error,result1)=>{
                if (error) {
                    console.error('Error inserting data into MySQL:', error);
                    res.send('Error inserting data into MySQL');
                    return;
                }
                if(result1){
                    const query2='INSERT INTO history(Transaction_ID,payee,recipient,Date,Description,payee_amount,reci_amount) VALUES (?, ?, ?,?,?,?,?)';
            conn.query(query2,[tid,urname,acc,date,desc,empty,r_amount],(error,result2)=>{
                if (error) {
                    console.error('Error inserting data into MySQL:', error);
                    res.send('Error inserting data into MySQL');
                    return;
                }
                console.log('success');
            })
                }   
                res.send("Payment Success");
            })
        }

});

});





app.get('/logout', (req, res) => {
    req.session.destroy((err)=>{
        if (err){
            console.error('error destroying session');
        }
        else{
            res.redirect('/login');
        }
    })
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});