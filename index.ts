import "reflect-metadata";
import Express, { NextFunction, Request, Response } from "express";
import { BODY_PARAM, Get } from "./routeDecorators";

const app = Express();

app.use(Express.json());

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

class Controller {
  constructor(protected router = Express.Router()) {
    this.assignRoutes(this);
  }

  get getRouter() {
    return this.router;
  }

  protected assignRoutes<T extends Controller>(child: T) {
    const prot = (child as any).__proto__;
    if (!prot.routes) throw new Error("No routes were assigned");

    for (const [method, values] of Object.entries(prot.routes)) {
      for (const [fnName, path, middlewares] of values as [
        string,
        string,
        any[]
      ]) {
        if (middlewares && middlewares.length > 0) {
          (this.router as any)[method](path, ...middlewares, prot[fnName]);
        } else {
          (this.router as any)[method](path, prot[fnName]);
        }
      }
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
}

const catsController = new CatsController();

app.use(catsController.getRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
