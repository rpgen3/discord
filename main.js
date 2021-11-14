(async () => {
    const {importAll, getScript, importAllSettled} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    const $ = window.$;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<dl>').appendTo(html),
          body = $('<dl>').appendTo(html),
          foot = $('<dl>').appendTo(html);
    const rpgen3 = await importAll([
        'input'
    ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`));
    const addBtn = (h, ttl, func) => $('<button>').appendTo(h).text(ttl).on('click', func);
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    $('<div>').appendTo(head).text('discordの絵文字でプリントする');
    $('<div>').appendTo(head).text('処理する画像の設定');
    const makeLoadFunc = ctor => url => new Promise((resolve, reject) => Object.assign(new ctor, {
        onload: ({target}) => resolve(target),
        onloadedmetadata: ({target}) => resolve(target),
        onerror: reject,
        crossOrigin: 'anonymous',
        src: url
    }));
    const image = new class {
        constructor(){
            this.config = $('<div>').appendTo(head);
            this.html = $('<div>').appendTo(head);
            this._load = makeLoadFunc(Image);
            this.img = null;
        }
        async load(url){
            this.html.empty().append(this.img = await this._load(url));
        }
    };
    { // 画像入力
        const selectImg = rpgen3.addSelect(image.config, {
            label: 'サンプル画像',
            save: true,
            list: {
                'レナ': 'Lenna.png',
                'アニメ風レナ': 'Lena_all.png',
                'マンドリル': 'Mandrill.png'
            }
        });
        selectImg.elm.on('change', () => {
            image.load(`https://rpgen3.github.io/spatialFilter/img/${selectImg()}`);
        }).trigger('change');
        const inputURL = rpgen3.addInputStr(image.config, {
            label: '外部URL'
        });
        inputURL.elm.on('change', () => {
            const urls = rpgen3.findURL(inputURL());
            if(urls.length) image.load(urls[0]);
        });
        $('<input>').appendTo(image.config).prop({
            type: 'file'
        }).on('change', ({target}) => {
            const {files} = target;
            if(files.length) image.load(URL.createObjectURL(files[0]));
        });
    }
    const inputWidth = rpgen3.addInputNum(body, {
        label: '幅',
        save: true,
        min: 3,
        max: 32,
        value: 16
    });
    const inputMax = rpgen3.addInputNum(body, {
        label: '最大文字数',
        save: true,
        min: 500,
        max: 2000,
        value: 2000,
        step: 500
    });
    const msg = new class {
        constructor(){
            this.html = $('<div>').appendTo(body);
        }
        async print(str){
            this.html.text(str);
            await sleep(0);
        }
    };
    addBtn(body, '出力', () => start()).css({
        color: 'white',
        backgroundColor: 'red'
    });
    const luminance = (r, g, b) => r * 0.298912 + g * 0.586611 + b * 0.114478 | 0;
    const RGB2code = (r, g, b) => [r, g, b].map(v=>('0' + (v|0).toString(16)).slice(-2)).join('').toUpperCase();
    const start = async () => {
        const max = inputMax() / 6,
              {img} = image,
              {width, height} = img,
              w = inputWidth(),
              h = w * (height / width) | 0,
              cv = $('<canvas>').prop({
                  width: w,
                  height: h
              }),
              ctx = cv.get(0).getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const {data} = ctx.getImageData(0, 0, w, h),
              len = data.length >> 2;
        let cnt = 0, str = '';
        for(const i of Array(len).keys()) {
            if(!(++cnt % 100)) await msg.print(`${i}/${len}`);
            const _i = i << 2,
                  [r, g, b, a] = data.subarray(_i, _i + 4);
            if(a) str += `:${RGB2code(...Array(3).fill(luminance(r, g, b) & 0xf8))}:`;
            else str += ':null:';
            if(!((i + 1) % w)) str += '\n';
        }
        const arr = [''];
        for(const line of str.split('\n')) {
            const s = arr[arr.length - 1];
            if(s.length + line.length + 1 < max) arr[arr.length - 1] += line + '\n';
            else arr.push(line + '\n');
        }
        foot.empty();
        for(const str of arr) rpgen3.addInputStr(foot,{
            value: str.trim(),
            textarea: true,
            copy: true
        });
    };
})();
