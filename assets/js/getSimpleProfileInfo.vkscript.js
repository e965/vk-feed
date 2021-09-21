// код хранимой процедуры execute.getSimpleProfileInfo

var profileInfo = API.account.getProfileInfo({});

var profilePhoto =    
  API.photos.get({ owner_id: Args.userID,
  album_id: "profile", count: 1, rev: 1 });
  
return 
  { "name": profileInfo.first_name,
  "photo": profilePhoto.items@.sizes[0][0].url };