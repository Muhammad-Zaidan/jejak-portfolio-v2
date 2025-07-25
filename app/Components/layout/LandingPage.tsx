import AnimatedContent from "../Fragments/AnimatedContent/AnimatedContent";

const LandingPage = () => {
  return (
    <>
      <div className="container">
        <div className="max-w-4xl h-screen mx-auto relative">
          <div className="mt-50">
            <AnimatedContent
              distance={80}
              direction="horizontal"
              reverse={false}
              duration={2}
              ease="power3.out"
              initialOpacity={0}
              animateOpacity
              scale={0.8}
              threshold={0}
              delay={0.2}
            >
              <img
                src="assets/logo.png"
                className="lg:w-[450px] lg:mx-0 w-xs mx-auto"
                alt="logo"
              />
            </AnimatedContent>
            <AnimatedContent
              distance={50}
              direction="vertical"
              reverse={false}
              duration={2}
              ease="power3.out"
              initialOpacity={0}
              animateOpacity
              scale={1}
              threshold={0}
              delay={0.2}
            >
              <p className="lg:text-2xl text-md px-6 mx-6 lg:px-0 lg:mx-0 my-5 max-w-lg text-slate-500">
                Muhammad Zaidan, guiding impactful solutions with clean code and
                thoughtful design
              </p>
            </AnimatedContent>
          </div>
          <div className="absolute left-1/2 bottom-60 -translate-1/2">
            <img
              src="assets/scroll.gif"
              width="25px"
              className="opacity-75"
              alt=""
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
