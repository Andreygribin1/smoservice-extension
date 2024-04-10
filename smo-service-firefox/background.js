browser.runtime.onMessage.addListener(async function(message, sender) {
  if (message.to === "background") {
    if(message.message['auth']){
      let data = await auth(message.message['auth']);
      browser.runtime.sendMessage({
          to: "popup",
          message: {services: data, inputs: message.message['auth']}
        });
      }else if(message.message['create']){
        let data = await create(message.message['create']);

        browser.runtime.sendMessage({
            to: "popup",
            message: {created: data, service_id: message.message['create'].service_id, count: message.message['create'].count}
          });
      }else if(message.message.authData && message.message.status){
        if(message.message.status.length > 0){
          let promises = []
          for(let order_id of message.message.status){
            let data = message.message.authData;
            data['order_id'] = order_id;
            let pr = check_order(data);
            promises.push(pr);
          }

          let res = await Promise.all(promises);

          browser.runtime.sendMessage({
              to: "popup",
              message: {get_status: res}
            });
        }
      }
    }
});


function auth(params) {
  return new Promise(async(resolve) => {
      try{
        let body = new FormData();
        for(let name in params){
          body.append(name, params[name]);
        }
        body.append('action', 'services');

        let response = await fetch('https://smoservice.media/api/', {
          method: 'POST',
          body
        });
        let res = await response.json();
        resolve(res);
      }catch(err){
      resolve({
        data: [],
        desc: "Exception error",
        type: "error"
      });
    }
  });
}


function create(params) {
  return new Promise(async(resolve) => {
      try{
        let body = new FormData();
        for(let name in params){
          body.append(name, params[name]);
        }

        let response = await fetch('https://smoservice.media/api/', {
          method: 'POST',
          body
        });
        let res = await response.json();
        resolve(res);
      }catch(err){
      resolve({
        data: [],
        desc: "Exception error",
        type: "error"
      });
    }
  });
}


function check_order(params) {
  return new Promise(async(resolve) => {
      try{
        let body = new FormData();
        for(let name in params){
          body.append(name, params[name]);
        }
          body.append('action', 'check_order');

        let response = await fetch('https://smoservice.media/api/', {
          method: 'POST',
          body
        });
        let res = await response.json();
        resolve(res);
      }catch(err){
      resolve({
        data: [],
        desc: "Exception error",
        type: "error"
      });
    }
  });
}
