var express = require('express');
var app = express();
var Car = require('./cars');
var Event = require('./events');
var dbConnection = require('./database');
var Promise = require('bluebird');

app.get('/cars/:num', function(req, res){
    res.send(makeAdaCars(req.params.num));
});

app.get('/index-cars/:num', async (req, res)=>{
    var cars = makeAdaCars(req.params.num);
    let db = new dbConnection();
    db.insertCars(cars);
    res.send("SUCCESS");
});

app.get('/get-all-cars', async (req, res)=>{
    let db = new dbConnection();
    var data = await db.getAll();
    res.send(data);
});

app.get('/car/:id', async (req, res)=>{
    let db = new dbConnection();
    var car = await db.findById(req.params.id);
    res.send(car);
})

app.get('/index-service-issues/:num', async (req, res)=>{
    let db = new dbConnection();
    let serviceIssues = await makeADaServiceIssues(req.params.num);
    db.insertServiceIssues(serviceIssues);
    res.send("SUCCESS");
})
app.get('/serviceIssues/:id', async(req, res)=>{
    let db = new dbConnection();
    let ServiceIssues = await db.findServiceIssues(req.params.id);
    res.send(ServiceIssues);
})

var idPrefix = ['SHMC', 'FRAN', 'CHRI', 'ANJU', 'USLS', 'ILSS'];
var commodities = ['Corn', 'Oats', 'Rice', 'Soybeans', 'Rapeseed', 'Wheat',  'Milk', 'Cocoa',
 'Coffee','Cotton', 'Cattle', 'Hogs', 'Feeder Cattle','Crude Oil', 'Ethanol', 'Natural gas', 'Heating Oil'];
var carTypes = ['Boxcar', 'CenterBeam', 'Covered hopper', 'Covered wagon', 'Double door boxcar', 'Gondola', 'Intermodal', 'Baggage Car', 'Bilevel car', 'Coach', 'Boxmotor', 'Refreigerated Car'];
var eventName = ['Released for Movement', 'Pulled from Industry', 'Arrived', 'Departed', 'General Hold', 'Released from Hold'];
var reasons = ['Broken Wheel', 'Load Shift', 'Load Too big (uh oh)', 'Missing Car', 'Too many Hobos', 'Not Enough Hobos', 'Tornado', 'Damaged Cargo'];
var statuses = ["Service Plan Available", "Service Plan Not Available"];
var authors = ['Lance Fritz', 'Jimmy Nutron', 'Anjuli Goring', 'Santa Claus', 'Jimmy Johns', 'Chris Gu', 'Isabell Smith'];
var companies = ['Jimmy Johns', 'VIPAR heavy duty', 'Union Pacific', 'buildertrend', 'Urban Lumber', 'BNSF', 'BIG DOGS and COFFEE?', "Toys 'R' Us"]
var lorem = "Lorem Ipsum is simply dummy text of the printing and typesetting industry.";
function location(state, city){
    return {
        state: state,
        city: city
    };
}
var locations = [location('Spokane', 'WA'), location('Seattle', 'WA'), location('Portland', 'OR'), location('Sacramento', 'CA'), location('San Franciso', 'CA'), location('Sockton', 'CA'), location('Salt Lake City', 'UT'), location('Omaha', 'NE'), location('St. Louis', 'MO'), location('Kansas City', 'MO'), location('Dallas', 'TX'), location('El Paso', 'TX'), location('Carson City', 'NE'), location('Boise', 'ID')];

function makeAdaCars(num){
    var cars = [];
    for(let i = 0; i < num; i++){
        cars.push(createCar());
    }
    return cars;
}
async function makeADaServiceIssues(num){
    let db = new dbConnection();
    var cars = await db.getAll();
    var serviceIssues = [];
    for(let i = 0; i < num; i++){
        serviceIssues.push(createServiceIssue(cars[i].id));
    }
    return serviceIssues;
}

function createCar(){
    let car = new Car();
    let prefix = randomSelect(idPrefix);
    let idNum = randNum(0, 9999);
    car.id =  prefix + idNum;
    car.empty = trueOrfalse();
    car.commodity = randomSelect(commodities);
    car.carType = randomSelect(carTypes);
    car.serviceIssue = {
        referenceNumber: randNum(0, 99999),
        status: openOrClosed()
    }
    car.eta = new Date();
    var oldDate = new Date(2015, 0, 1);
    createEvents("Completed", oldDate, car.completedEvents, car);
    var date = new Date();
    createEvents("Scheduled", date, car.scheduledEvents, car);
    return car;
}
app.listen(1337);
console.log('Server running at http://127.0.0.1:1337');

function randomSelect(arr){
    return arr[Math.floor(Math.random() * (arr.length))];
}
function trueOrfalse(){
   return randNum(0, 1) == 1?"true":"false";
}
function randNum(lower, upper){
    return Math.floor((Math.random() * (upper - lower + 1)) + lower);
}
function openOrClosed(){
    return randNum(0, 1) == 1?"closed":"open";
}
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function createEvents(type, starting, eventArr, car){
    var oldDate = starting
    for(let i = 0; i < randNum(0, 11); i++){
        let event = new Event();
        event.type = type;
        event.carId = car.id;
        event.name = randomSelect(eventName);
        let diff = 200;
        let newDate = randomDate(oldDate, new Date(oldDate.getTime() + diff*60000));
        event.dateTime = newDate;
        oldDate = newDate;
        event.location = randomSelect(locations);
        eventArr.push(event);
    }
}

function createServiceIssue(id){
    var refNum = randNum(0, 9999);
    return {
        dateOpened: randomDate(new Date(), new Date(2012, 0, 1)),
        dateUpdated: randomDate(new Date(), new Date(2012, 0, 1)),
        reason: randomSelect(reasons),
        status: randomSelect(statuses),
        equipmentId: id,
        referenceNumber: refNum,
        comments: createComments(refNum)
    }
}

function createComments(refNum){
    var comments = [];
    for(let i = 0; i < randNum(1, 5); i++){
        comments.push({
            dateCreated:randomDate(new Date(2012, 0, 1), new Date()),
            author: randomSelect(authors),
            company: randomSelect(companies),
            comments: lorem,
            serviceIssueNum: refNum
        })
    }
    return comments;
}