const sqlite3 = require('sqlite3').verbose();
var Promise = require('bluebird');
var Car = require('./cars');
var Event = require('./events');
var db;
// open database in memory
function openDB(){
    db = new sqlite3.Database('./db/data.db', (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to the SQlite database.');
    });
}
openDB();

db.serialize(function() {
    // db.run("DROP TABLE cars");
    // db.run("DROP TABLE events");
    //db.run("DROP TABLE comments");
    //db.run("DROP TABLE serviceIssues");
    db.run("CREATE TABLE IF NOT EXISTS cars(id Int PRIMARY KEY, empty Int, commodity varchar, carType varchar,referenceNum varchar, status varchar, eta Int)");
    db.run("CREATE TABLE IF NOT EXISTS events(carId Int, name varchar, dateTime Int, city varchar, state varchar, type varchar, FOREIGN KEY(carId) REFERENCES cars(id))");
    db.run("CREATE TABLE IF NOT EXISTS serviceIssues(dateOpened Int, dateUpdated Int, reason varchar, status varchar, equipmentId varchar, referenceNum Int, FOREIGN KEY(equipmentId) REFERENCES cars(id))");
    db.run("CREATE TABLE IF NOT EXISTS comments(dateCreated Int, author varchar, company varcar, comments varchar, serviceIssueId Int, FOREIGN KEY(serviceIssueId) REFERENCES serviceIssues(referenceNum))");
    
});



module.exports = class dbConnection{
    constructor(){
        this.selectCarsSQL = "SELECT c.id as id, c.empty as empty, c.commodity as commodity, c.carType as carType, c.referenceNum, c.status as status, c.eta as eta, e.name as name, e.dateTime as dateTime, e.city as city, e.state as state, e.type as type"
        + " FROM cars as c LEFT JOIN events as e on c.id = e.carId ";
        this.selectIssuesSQL = "SELECT i.dateOpened as opened, i.dateUpdated as updated, i.reason as reason, i.status as status, i.referenceNum as referenceNumber, c.dateCreated as commentCreateDate, c.author as author, c.company as company, c.comments as userComments from serviceIssues as i LEFT JOIN comments as c on c.serviceIssueId = i.referenceNum ";
    }
    insertCars(cars){
        var stmt = db.prepare("INSERT INTO cars values(?, ?, ?, ?, ?, ?, ?)");
        var eventStmt = db.prepare("INSERT INTO events values(?, ?, ?, ?, ?, ?)");
        cars.forEach((car)=>{
            stmt.run(car.id, car.empty == 'true'?1:0, car.commodity, car.carType, car.serviceIssue.referenceNumber, car.serviceIssue.status, car.eta.getTime());
            car.completedEvents.forEach((event)=>{
                console.log(event);
                eventStmt.run(event.carId, event.name, event.dateTime.getTime(), event.location.city, event.location.state, event.type);
            });
            car.scheduledEvents.forEach((event)=>{
                console.log(event);
                eventStmt.run(event.carId, event.name, event.dateTime.getTime(), event.location.city, event.location.state, event.type);
            });
        });

        stmt.finalize(()=>{
        });
    }
    insertServiceIssues(serviceIssues){
        var stmt = db.prepare("INSERT INTO serviceIssues values(?, ?, ?, ?, ?, ?)");
        var commentStmt = db.prepare("INSERT INTO comments values(?, ?, ?, ?, ?)");
        serviceIssues.forEach((issue)=>{
            stmt.run(issue.dateOpened.getTime(), issue.dateUpdated.getTime(), issue.reason, issue.status, issue.equipmentId, issue.referenceNumber);
            issue.comments.forEach((comment)=>{
                commentStmt.run(comment.dateCreated.getTime(), comment.author, comment.company, comment.comments, comment.serviceIssueNum);
            });
        });
        stmt.finalize();
        commentStmt.finalize();
    }

    getAll(){
        return new Promise((resolve, reject) => {
            var data = [];
            db.all(this.selectCarsSQL, function(err, rows) {
                    formatCars(rows, data);
                    resolve(data);
            })
              
        });
            
    }
    findById(id){
        return new Promise((resolve, reject) =>{
            var data = [];
            db.all(this.selectCarsSQL + "WHERE c.id = '" + id + "'", (err, rows)=>{
                formatCars(rows, data);
                resolve(data[0]);
            });
        })
    }
    findServiceIssues(equipmentId){
        return new Promise((resolve, reject) =>{
            var data = [];
            db.all(this.selectIssuesSQL + " WHERE i.equipmentId = '" + equipmentId + "'", (err, rows)=>{
                let issues = formatIssue(rows);
                resolve(issues);
            })
        })
    }
}
//SELECT opened, updated, reason, status, referenceNumber, commentCreateDate, author, company, 
function formatIssue(rows){
    var id = 0;
    var oldId = 1;
    var issues =[];
    var issue = {comments:[]};
    rows.forEach((row)=>{
        id = row.referenceNumber;
        if(oldId == id){
            issue.comments.push({
                dateCreated:row.commentCreateDate,
                author: row.author,
                company: row.company,
                comments: row.userComments,
            });
        }else{
            if(oldId != 1){
                issues.push(issue);
            }
            issue = {
                dateOpened: row.opened,
                dateUpdated: row.dateUpdated,
                reason: row.reason,
                status: row.status,
                referenceNumber: row.referenceNumber,
                comments: []
            }
        }
        oldId = id;
    });
    issues.push(issue);
    return issues;
}

function formatCars(rows, data){
    var id;
    var oldId = 1;
    var car = new Car();
    rows.forEach((row) =>{
        id = row.id;
        if(oldId == id){
            let event = new Event();
            event.name = row.name;
            event.dateTime = new Date(row.dateTime);
            event.location.city = row.city;
            event.location.state = row.state;
            if(row.type == "Completed"){
               car.completedEvents.push(event); 
            }
            else{
                car.scheduledEvents.push(event);
            }
        }else{
            if(oldId != 1){
                data.push(car);
            }
            car = new Car();
            car.id = row.id;
            car.commodity = row.commodity;
            car.carType = row.carType;
            car.empty = row.empty == 0?"false":"true";
            car.serviceIssue.referenceNumber = row.referenceNum;
            car.serviceIssue.status = row.status;
            car.eta = new Date(row.eta);
        }
        oldId = id;
    });
    data.push(car);
}



function closeConnection(){
    db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log('Close the database connection.');
    });
}