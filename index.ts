import "reflect-metadata";
import Express, { NextFunction, Request, Response } from "express";

const app = Express();

app.use(Express.json());

const BODY_PARAM = "body";

const Body = (
  target: any,
  propertyKey: string,
  parameterIndex: number
): any => {
  const entry = [propertyKey, BODY_PARAM, parameterIndex];
  if (target["toConvert"]) {
    target["toConvert"].push(entry);
  } else {
    target["toConvert"] = [entry];
  }
};

const Get =
  (path: string) =>
  (target: any, propertyKey: string | symbol, descriptor: any) => {
    console.log("Begin GET decorator");

    if (!target["getRoutes"]) {
      target["getRoutes"] = [[propertyKey, path]];
    } else {
      target["getRoutes"].push([propertyKey, path]);
    }

    const toConvertVars = (target.toConvert ?? [])
      .filter((x: string) => x[0] === propertyKey)
      .sort((a: any, b: any) => a[2] - b[2])
      .map((x: any) => x[1]);

    const originalFn = descriptor.value;

    // console.log(Reflect.getMetadata("design:paramtypes", target, propertyKey));

    descriptor.value = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      console.log("Begin DESCRIPTOR FN");

      let convertedVars: any = [];

      if (toConvertVars.length > 0) {
        for (const paramType of toConvertVars) {
          switch (paramType) {
            case BODY_PARAM:
              convertedVars.push(req.body);
              break;
          }
        }
      }

      try {
        const toResp = await originalFn(...convertedVars);

        console.log("Resing JSON");
        res.json(toResp);
      } catch (err) {
        next(err);
      }
    };
    console.log("End GET decorator");
  };

class Controller {
  constructor(protected router = Express.Router()) {
    this.assignRoutes(this);
  }

  get getRouter() {
    return this.router;
  }

  protected assignRoutes<T extends Controller>(child: T) {
    const prot = (child as any).__proto__;
    for (const [fnName, path] of prot.getRoutes ?? []) {
      this.router.get(path, prot[fnName]);
    }
  }
}

class CatsController extends Controller {
  constructor() {
    super();
  }

  @Get("/cats")
  public async getCats(@Body body: any): Promise<string> {
    console.log(body);
    console.log("in get cats");
    return "a";
  }

  @Get("/cats-colors")
  public async getDogs(@Body body: any): Promise<string> {
    console.log(body);
    console.log("in get dogs");
    return "a";
  }
}

class DogsController extends Controller {
  constructor() {
    super();
  }

  @Get("/dogs-color")
  public async getCats(@Body body: any): Promise<string> {
    console.log(body);
    console.log("in get cats");
    return "a";
  }

  @Get("/dogs")
  public async getDogs(@Body body: any): Promise<string> {
    console.log(body);
    console.log("in get dogs");
    return "a";
  }
}

const catsController = new CatsController();
const dogsController = new DogsController();

app.use(catsController.getRouter);
app.use(dogsController.getRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
