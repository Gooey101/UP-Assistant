module.exports = class Event{
    constructor(){
        this.carId;
        this.type;
        this.name;
        this.dateTime;
        this.location= {
            city:undefined,
            state:undefined
        }
    }
}