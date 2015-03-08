x = [300 ; 500 ; 700];
y = x * 1.75 + 10;
predict = 800; 

mu = mean(x);
x = x - mu;
sigma = std(x);
x = x ./ sigma;

m = length(y);
x = [ones(m, 1), x];
a = 0.01;

t = [0;0];
err = zeros(1, 2000);

for i=1:length(err),
  df = (x * t - y);
  err(i) = (df' * df) / 2 / m;
  vec = (x' * df) / m;
  t = (t - (vec * a));
endfor

printf( "theta0: %f theta1: %f\n",t(1),t(2));

prediction = predict - mu;
prediction = prediction / sigma;

printf( "Prediction(800): %f\n",prediction * t(2) + t(1));