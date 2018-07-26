module.exports = class Cars{
    constructor(){
        this.id;
        this.empty;
        this.commodity;
        this.carType;
        this.serviceIssue = {
            referenceNumber:undefined,
            status:undefined
        };
        this.eta;
        this.completedEvents = [];
        this.scheduledEvents = [];
    }
}
