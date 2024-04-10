(function(){
  const blockAuth = document.querySelector('#auth');
  const fieldApiKey = document.querySelector('input[name="api_key"]');
  const fieldUserId = document.querySelector('input[name="user_id"]');
  const buttonAuth = document.querySelector('button#Authorization');

  const blockOrderCreate = document.querySelector('#orderCreate');
  const fieldCurrency = document.querySelector('select[name="currency"]');
  const fieldAmount = document.querySelector('input[name="amount"]');
  const buttonCreate = document.querySelector('button#create');

  const listTbody =document.querySelector('#lists tbody');

  let authData;
  let services;

  chrome.storage.local.get(function(data){

    if(data.state){
      fieldUserId.value = data.state.user_id ?? '';
      fieldApiKey.value = data.state.api_key ?? '';
    }
    if(data.auth){
      fieldUserId.value = data.auth.user_id;
      fieldApiKey.value = data.auth.api_key;
      buttonAuth.innerText = 'Change';
      blockOrderCreate.classList.remove('none');
      authData = data.auth;
    }else{
      document.querySelector('#auth .accordion-button').click();
    }

    if(data.lists){
      document.querySelector('#lists').classList.remove('none');
    }
    if(data.services){
      services = data.services;
      setServiceRoot();
    }
  })


function setServiceRoot(){
  let rootCategory = services.reduce((acc, item) => ({...acc, [item.root_category_id]: item.root_category_name}),{})
  let element = document.createElement('option');

  const option = element.cloneNode(true);
  option.innerText = 'Select ...';
  option.value = 0;
  document.querySelector('select[name="root_categorical"]').appendChild(option);
  for(let id in rootCategory){
    const option = element.cloneNode(true);
    option.innerText = rootCategory[id];
    option.value = id;
    document.querySelector('select[name="root_categorical"]').appendChild(option);
  }
  element.remove();
}

document.querySelector('select[name="root_categorical"]').addEventListener('change', function(){
  document.querySelectorAll('.create-custom').forEach(node => node.classList.add('none'))
  if(parseInt(this.value) !== 0){
    setServiceActions(this.value);
    document.querySelector('#actions').classList.remove('none');
  }

})

function setServiceActions(root_id){
  let actions = services.filter(item => item.root_category_id === root_id).reduce((acc, item) => ({...acc, [item.category_id]: item.category_name}),{})

  document.querySelector('select[name="actions"]').innerHTML = '';
  let element = document.createElement('option');

  const option = element.cloneNode(true);
  option.innerText = 'Select ...';
  option.value = 0;
  document.querySelector('select[name="actions"]').appendChild(option);
  for(let id in actions){
    const option = element.cloneNode(true);
    option.innerText = actions[id];
    option.value = id;
    document.querySelector('select[name="actions"]').appendChild(option);
  }
  element.remove();
}


document.querySelector('select[name="actions"]').addEventListener('change', function(){
  document.querySelectorAll('.create-custom:not(#actions)').forEach(node => node.classList.add('none'))
  if(parseInt(this.value) !== 0){
    setServiceTariff(this.value);
    document.querySelector('#tariff').classList.remove('none');
  }

})


function setServiceTariff(id){
  let tariffs = services.filter(item => item.category_id === id).reduce((acc, item) => ({...acc, [item.id]: item.name}),{})

  document.querySelector('select[name="tariff"]').innerHTML = '';
  let element = document.createElement('option');

  const option = element.cloneNode(true);
  option.innerText = 'Select ...';
  option.value = 0;
  document.querySelector('select[name="tariff"]').appendChild(option);
  for(let id in tariffs){
    const option = element.cloneNode(true);
    option.innerText = tariffs[id];
    option.value = id;
    document.querySelector('select[name="tariff"]').appendChild(option);
  }
  element.remove();
}


document.querySelector('select[name="tariff"]').addEventListener('change', function(){
  document.querySelectorAll('.create-custom:not(#actions):not(#tariff)').forEach(node => node.classList.add('none'))
  if(parseInt(this.value) !== 0){
    setServiceCount(this.value);
    document.querySelector('#count').classList.remove('none');
    document.querySelector('#link').classList.remove('none');
    document.querySelector('#amount').classList.remove('none');
  }

})

function setServiceCount(id){
  let service = services.filter(item => item.id === id);
  if(service[0]){
    service = service[0];
    document.querySelector('input[name="count"]').min =  service.min;
    document.querySelector('input[name="count"]').max =  service.max;
    document.querySelector('input[name="count"]').value =  service.min;
    document.querySelector('input[name="count"]').dataset.price =  service.price;
    document.querySelector('input[name="count"]').dispatchEvent(new Event('input'))
  }

}

document.querySelector('input[name="count"]').addEventListener('input', function(){
  document.querySelector('.minmax').innerText = `from ${this.min} to ${this.max}`;
  document.querySelector('.selectspan').innerText = `${this.value} pcs.`;
  document.querySelector('input[name="amount"]').value = `${Math.round(parseFloat(this.dataset.price) * parseInt(this.value))}`;

})

document.querySelector('input[name="link"]').addEventListener('input', function(){
  try{
    let par = new URL(this.value.trim())

    if(par.origin.includes('://') && par.host.includes('.')){
      buttonCreate.classList.remove('none')
      return false;
    }
  buttonCreate.classList.add('none')
  }catch(err){
    // console.log(err);
      buttonCreate.classList.add('none')
  }
})



  buttonAuth.addEventListener('click', async function(){
    let inputs = Array.from(blockAuth.querySelectorAll('input')).reduce((acc, node) => ({...acc, [node.name]: node.value.trim()}), {});
    for(let name in inputs){
      if(blockAuth.querySelector(`input[name="${name}"]`) && blockAuth.querySelector(`input[name="${name}"]`).value.trim() === ''){
        blockAuth.querySelector(`input[name="${name}"]`).classList.add('is-invalid');
        return false;
      }else{
        blockAuth.querySelector(`input[name="${name}"]`).classList.remove('is-invalid');
      }
    }
    document.querySelector('.preload').classList.remove('none');
    chrome.runtime.sendMessage({
      to: "background",
      message: {auth: inputs}
    });




  })

  chrome.runtime.onMessage.addListener(async function(message, sender) {
    if (message.to === "popup") {
      if(message.message.services && message.message.inputs){
        let res = message.message.services;
        let inputs = message.message.inputs;
        if('type' in res && 'desc' in res && res['type'] === 'error'){
          showError('#validationAuthFeedback', res['desc']);
          return false;
        }
        chrome.storage.local.set({ auth: inputs});
        chrome.storage.local.set({ services: res.data});
        services = res.data;
        setServiceRoot();
        authData = inputs;
        buttonAuth.innerText = 'Change';
        blockOrderCreate.classList.remove('none');
        document.querySelector('.preload').classList.add('none');
        document.querySelector('#orderCreate .accordion-button').click();
      }else if(message.message.created && message.message.service_id && message.message.count){
        let res = message.message.created;
        let service_id = message.message.service_id;
        let count = message.message.count;
        if('type' in res && 'desc' in res && res['type'] === 'error'){
          showError('#validationCreateOrderFeedback', res['desc']);
          return false;
        }

        if('data' in res && res.data.order_id){
          chrome.storage.local.get(['lists'], function(e){
            let lists = [];
            if(e.lists){
              lists = e.lists;
            }
            lists.push({service_id, count, ...res.data});

            document.querySelector('#lists').classList.remove('none');
            chrome.storage.local.set({lists}, function(){
              window.location.reload();
            })

            // renderList();
          })
        }

        document.querySelector('.preload').classList.add('none');

      }else if(message.message.get_status){
        let results = message.message.get_status;
        let objStatus = {};
        for(let res of results){
          if('data' in res && res.data.order_id && res.data.status){
            // console.log(res.data.status)
            if(document.querySelector(`td[data-status="${res.data.order_id}"]`)){
              document.querySelector(`td[data-status="${res.data.order_id}"]`).innerHTML = res.data.status;
              objStatus[res.data.order_id] = res.data.status;
            }
          }
        }
        updateStatus(objStatus)

      }

    }
  });

  function updateStatus(status){

    chrome.storage.local.get(['lists'], function(e){
      if(e.lists){
        let lists = e.lists;
        lists = lists.map(item => {
          if(item.order_id in status){
            item.status = status[item.order_id];
          }
          return item;
        })
         chrome.storage.local.set({lists})
      }
    })

  }


  function createOrder(params) {

        if(authData === null) {
          resolve({
            data: [],
            desc: "Not Authorization",
            type: "error"
          });
        }



          let data = {
            'user_id': authData.user_id,
            'api_key': authData.api_key,
            'action': 'create_order',
            'service_id': params.tariff,
            'count': params.count,
            'url': params.link,
          };

          document.querySelector('.preload').classList.remove('none');

          chrome.runtime.sendMessage({
            to: "background",
            message: {create: data}
          });


  }

  buttonCreate.addEventListener('click', async function(){
    let inputs = Array.from(blockOrderCreate.querySelectorAll('input, select')).reduce((acc, node) => ({...acc, [node.name]: node.value.trim()}), {});
    for(let name in inputs){
      if(blockOrderCreate.querySelector(`*[name="${name}"]`) && blockOrderCreate.querySelector(`*[name="${name}"]`).value.trim() === ''){
        blockOrderCreate.querySelector(`*[name="${name}"]`).classList.add('is-invalid');
        return false;
      }else{
        blockOrderCreate.querySelector(`*[name="${name}"]`).classList.remove('is-invalid');
      }
    }


     createOrder(inputs);

  });





  function renderList(){

    chrome.storage.local.get(['lists'], function(data){

      let str = '';

      if(data.lists){
        let service_info = services.reduce((acc, item) => ({...acc, [item.id]:  item}),{})
        let stats = [];
        for(let item of data.lists){
        
          let order = service_info[item['service_id']];

          str += `<tr>
            <td>
              ${order.root_category_name} / <br>
              ${order.category_name} / <br>
              ${order.name}
            </td>
            <td>${item.count}</td>
            <td>${item.price}</td>
            <td data-status="${item.order_id}" data-order="${item.service_id}">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            </td>

          </tr>`;
          if(!item.status || item.status !== 'completed'){
            stats.push(item.order_id);
          }
        }
          getStatus(stats);
      }



      listTbody.innerHTML = str;
    })

  }

  renderList();

  function getStatus(status){
      if(authData === null) {
        return false;
      }

    chrome.runtime.sendMessage({
      to: "background",
      message: {status, authData}
    });
  }









  function showError(selector, message){
    if(document.querySelector(selector) !== null) {

      document.querySelector(selector).innerText = message;
      document.querySelector(selector).classList.add('show');

      setTimeout(() => {
        document.querySelector(selector).classList.remove('show');
      }, 2000);
    }
  }


  document.querySelector('#auth').addEventListener('input', function(e){
    if(e.target.tagName.toLowerCase() === 'input'){
      chrome.storage.local.get(['state'], function(data) {
        let   state = {};
        if(data.state && Object.keys(data.state).length > 0){
          state = data.state;
        }

        state[e.target.name] = e.target.value.trim();
        chrome.storage.local.set({state});
      })
    }
  })

  document.body.addEventListener('click', (e) => {
    if(e.target.closest('.accordion-button')){
      let flag = e.target.classList.contains('collapsed');
      document.querySelectorAll('.accordion-button').forEach(node => node.classList.add('collapsed'));
      document.querySelectorAll('.accordion-collapse.show').forEach(node => node.classList.remove('show'));

      if(flag){
        e.target.classList.remove('collapsed');
        e.target.closest('.accordion-item').querySelector('.accordion-collapse').classList.add('show');
      }

    }
  })

})();
