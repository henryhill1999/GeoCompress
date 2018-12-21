var years = [];
var graphic1790,graphic1880
var latMin,latMax, lonMin, lonMax

// Put any asynchronous data loading in preload to complete before "setup" is run
function preload() {
  //data1790 = loadJSON('assets/1790.json');
  data1880 = loadJSON('assets/1880.json');
  compressedStates = loadJSON('assets/reconstructed.json');
}

function setup() {
  createCanvas(850, 425);

  lonMin = -4000000;
  lonMax = 4000000;
  latMin = -2000000;
  latMax = 2000000;

  graphic1880 = createGraphics(850,425);

  reconstructedGraphic = createGraphics(850,425);

  reconstructedGraphic.push();
  reconstructedGraphic.translate(width/2, height/2);
  reconstructedGraphic.scale(width/(lonMax-lonMin),-height/(latMax-latMin));

  reconstructedGraphic.fill(150,150,255);
  reconstructedGraphic.stroke(0,0,0);
  reconstructedGraphic.strokeWeight(5000);

  compressedStates.states.forEach(s => {
    stateVs = reconstruct(s,data1880)
    reconstructedGraphic.beginShape()
    stateVs.forEach(v => {
        reconstructedGraphic.vertex(v[0],v[1]);
    });
    reconstructedGraphic.endShape(CLOSE)
  });

  reconstructedGraphic.pop();

  createMap(graphic1880,data1880,[200,200,255]);
  //createMap(graphic,data1790,[150,150,255]);

  years.push(graphic1880);
  //years.push(graphic1790);

}

function reconstruct(vs,prev){
  res = []
  vs.forEach(v => {
    if (Array.isArray(v)){
      res.push(v)
    }else {
      hook = findVertex(prev.features[v.src].geometry.coordinates,v.hook)
      for (let l = 0; l < v.length+1; l++){
        crds = prev.features[v.src].geometry.coordinates
        res.push(crds[(hook+l)%crds.length])
      }
    }
  });
  return res
}

function findVertex(ls,v){
  for (let i = 0; i<ls.length; i++){
    if(ls[i][0]==v[0] && ls[i][1]==v[1]){
      return i
    }
  }
  console.log('not found')
}

function draw() {
  background(200,255,230);

  fill(0)
  for (var img = 0; img<years.length; img++) {
    1==1
    image(years[img],0,0);
  }

  fill(255,0,0);
  image(reconstructedGraphic,0,0)

  noStroke();

  toSelect = null;
}

function createMap(g,data,col){
  if(!col){
    col = [220,220,255];
  }
  features = data.features;

  g.push();

  g.translate(width/2, height/2);

  g.scale(width/(lonMax-lonMin),-height/(latMax-latMin));

  //g.background(100,200,255);

  g.stroke(0,0,0);
  g.strokeWeight(5000);
  g.fill(col[0],col[1],col[2]);

  for (var i = 0; i < features.length; i++) {
    g.beginShape();
    for (var v = 0; v < features[i].geometry.coordinates.length; v++){
      coord = features[i].geometry.coordinates[v];
      g.vertex(coord[0],coord[1]);
    }
    g.endShape(CLOSE);
  }
  g.pop();
}
