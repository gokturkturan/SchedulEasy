import { get, getDatabase,child,ref, update, set} from "firebase/database";


function generateId() {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var token = '';
    for(var i = 0; i < 28; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
}

export class DatabaseHandler{

    static database = getDatabase();


    static registerUserData(userId,userName,email,birthDate,majority){
    set(ref(this.database,'users/'+ userId),{
        userName: userName,
        email: email,
        birthDate: birthDate,
        majority: majority
    });
    set(ref(this.database,'userNames/'+ userName),{uid:userId});
    }

    static createEvent(allEventInfo){//participant nodes is being pushed under the eventId node. it must be deleted
        
        const event_Id = generateId();
        console.log(allEventInfo);
        const db_event_node = {}
        const db_event_participants = {};
        
        const db_options = {}

        allEventInfo.options.map((opt,index)=> db_options[index]=opt)
        allEventInfo.options = db_options;


        set(ref(this.database,'events/'+ event_Id),allEventInfo);
        
        
        set(ref(this.database,'userEvents/'+allEventInfo.creatorName+'/'+event_Id),true);
        db_event_participants[allEventInfo.creatorName]=true
        Object.values(allEventInfo.participants).forEach((participant)=>{
            db_event_participants[participant]=true
            set(ref(this.database,'userEvents/'+participant+'/'+event_Id),true);
        })
            
        
        set(ref(this.database,'participantsOfEvent/'+ event_Id),db_event_participants);// Wrong must be {huxies:true} but {0:true}
        //it could be addUserToEvent(userName) func to call here to be more modular for the incoming invitations 
    }

    static async getUserName(userId){
        let userName = (await get(child(ref(this.database),`users/${userId}/userName`))).val();
        console.log(userName,"dbhandler");
        return userName
    }

    static async isUserExist(userName){
        let exists = (await get(child(ref(this.database),`userNames/${userName}`))).val();
        if (exists === null){
            return false
        }
        return exists.uid // it might return true take a look at later
    }

    static async getUserEventIds(userName){
        let events = (await get(child(ref(this.database),`userEvents/${userName}`))).val();
        return Object.keys(events)

    }

    static async getEventInfo(eventId){
        let event_info = (await get(child(ref(this.database),`events/${eventId}`))).val();
        let event_participants = (await get(child(ref(this.database),`participantsOfEvent/${eventId}`))).val()
        //console.log(event_participants,"a")
        event_info = {...event_info,participants:event_participants,id:eventId}
        //console.log(event_info,`eventId:${eventId} icin`);
        return event_info;
    }

    

    static async getUserEventInfos(userName){// critical
        let event_ids = Object.keys((await get(child(ref(this.database),`userEvents/${userName}`))).val());
        let events_info = [];
        event_ids.forEach((eventId) => events_info.push(this.getEventInfo(eventId)))
        ///events_info.forEach(event => console.log(event.title),"asd")
        return events_info;
    }

    static async leaveEvent(eventId,username){
        set(ref(this.database,'participantsOfEvent/'+ eventId + "/"+ username),{
        });
        set(ref(this.database,'userEvents/'+ username + "/"+ eventId),{
        });
    }

    static async submitVote(eventId,userName,votes){
        for( const date of Object.keys(votes)){
            //console.log(`id : ${date} -> vote : ${votes[date]}`)
            set(ref(this.database,'participantsOfEvent/'+ eventId + "/"+ userName + "/" + date), votes[date]);
        }
        
        
    }

    static async getVotes(eventId){
       let votes =  (await get(child(ref(this.database),'participantsOfEvent/'+ eventId))).val();
       let comings = {}
       let Ncomings = {}
       let ifNeed = {}
       for(const user of Object.keys(votes)){
        try{
            votes[user].forEach((opt,index)=> {
                //console.log(opt,index);
                switch(opt){
                    case "Coming":
                        try{
                            comings[index].push(user);
                        }catch{
                            comings[index]= [user];
                        }
                        
                        break;
                    case "Not":
                        try{
                            Ncomings[index].push(user);
                        }catch{
                            Ncomings[index]= [user];
                        }
                        
                        break;
                    case "If need":
                        try{
                            ifNeed[index].push(user);
                        }catch{
                            ifNeed[index]= [user];
                        }
                }
            });
        }catch{
            
        }
        }
       
           
             
       
       return {comings,Ncomings,ifNeed};
    }

}
